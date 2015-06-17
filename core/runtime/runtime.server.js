/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2015 Marco Minetti <marco.minetti@novetica.org>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */

global.runtime = global.runtime || {};

runtime._store = {};

runtime.get = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    return;
  }
  return runtime_object.value;
};

runtime.getMeta = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return {
    'value': runtime_object.value,
    'revision': runtime_object.revisione
  }
};

runtime.getRevision = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.revisione;
};

runtime.tryGet = function(name,revision){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  if (revision != null && revision !== runtime_object.revision){
    throw new Exception('variable %s does not match revision in runtime',name);
  } else {
    return runtime_object.value;
  }
};

runtime.create = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    runtime_object = runtime._store[name] = new RuntimeVariable(name);
  }
  return true;
};

runtime.set = function(name,value,_setter_id){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    runtime_object = runtime._store[name] = new RuntimeVariable(name);
  }
  runtime_object.update(value,_setter_id);
  return runtime_object.value;
};

runtime.trySet = function(name,value,revision,_setter_id){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    runtime_object = runtime._store[name] = new RuntimeVariable(name);
  }
  if (revision != null && revision !== runtime_object.revision){
    throw new Exception('variable %s does not match revision in runtime',name);
  } else {
    runtime_object.update(value,_setter_id);
    return runtime_object.value;
  }
};

runtime.isUpdated = function(name,revision){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    return false;
  }
  return (revision === runtime_object.revision);
};

//? if(CLUSTER) {
runtime.subscribe = function(name,id){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  runtime_object.subscribe(id);
  return true;
};

runtime.unsubscribe = function(name,id){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  runtime_object.unsubscribe(id);
  return true;
};

runtime.isSubscribed = function(name,id){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.isSubscribed(id);
};
//? }

runtime.waitAndLock = function(name,callback){
  var collection = this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    callback.reject(new Exception('variable %s does not exist in runtime',name));
  }
  var lockid = runtime_object.lock();
  var current_lockid = runtime_object.getCurrentLock();
  if (current_lockid === lockid) {
    callback.resolve(lockid);
  } else {
    if (platform.configuration.debug.runtime === true){
      console.debug('runtime variable %s wait lock started for id %s',name,lockid);
    }
    platform.events.wait('runtime.unlock', function (unlockid, nextid) {
      if (nextid === lockid) {
        return true;
      }
      return false;
    }).then(function () {
      callback.resolve(lockid);
    },callback.reject);
  }

  return callback.promise;
};

runtime.lock = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.lock();
};

runtime.unlock = function(name,lockid){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.unlock(lockid);
};

runtime.clearLock = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.clearLock();
};

runtime.isLocked = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.isLocked();
};

runtime.getCurrentLock = function(name){
  var runtime_object = runtime._store[name];
  if (runtime_object == null){
    throw new Exception('variable %s does not exist in runtime',name);
  }
  return runtime_object.getCurrentLock();
};

var RuntimeVariable = function(name){
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime defined variable %s',name);
  }
  this.name = name;
  this.value = undefined;
  this.revision = 0;
//? if(CLUSTER) {
  this.destinations = [];
//? }
  this.locks = [];
};

RuntimeVariable.prototype.update = function(value,_setter_id){
  var self = this;
  this.value = value;
  ++this.revision;
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime updated variable %s to value %s%s',this.name,value,(_setter_id != null)?(' (from node ' + _setter_id + ')'):'');
  }
//? if(CLUSTER) {
  this.destinations.forEach(function(destination){
    if (platform.configuration.debug.runtime === true){
      console.debug('runtime pushing variable %s value %s to %s',this.name,value,destination);
    }
    if (destination !== _setter_id) {
      platform.cluster.ipc._send(destination, 'runtime.update', {
        'name': self.name,
        'value': self.value
      });
    }
  });
//? }
};

//? if(CLUSTER) {
RuntimeVariable.prototype.subscribe = function(id){
  if (this.destinations.indexOf(id) === -1){
    this.destinations.push(id);
  }
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime variable %s subscribed by node %s',this.name,id);
  }
};

RuntimeVariable.prototype.unsubscribe = function(id){
  var node_id_index = this.destinations.indexOf(id);
  if (node_id_index !== -1) {
    this.destinations.splice(node_id_index, 1);
  }
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime variable %s unsubscribed by node %s',this.name,id);
  }
};

RuntimeVariable.prototype.isSubscribed = function(id){
  return (this.destinations.indexOf(id) !== -1);
};
//? }

RuntimeVariable.prototype.lock = function(){
  var lockid = native.uuid.v4();
  while(this.locks.indexOf(lockid) !== -1) {
    lockid = native.uuid.v4();
  }
  this.locks.push(lockid);
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime variable %s locked with id %s',this.name,lockid);
  }
  return lockid;
};

RuntimeVariable.prototype.unlock = function(lockid){
  if (this.locks[0] === lockid || lockid == null) {
    if (this.locks.length > 0) {
      var unlockid = this.locks.shift();
      platform.events.raise('runtime.unlock', unlockid, this.locks[0]);
    }
    if (platform.configuration.debug.runtime === true){
      console.debug('runtime variable %s unlocked %s',this.name,(lockid!=null)?('with id '+lockid):'without id');
    }
    return (this.locks.length === 0);
  } else {
    throw new Exception('variable %s can\'t be unlocked: lock id %s does not match current one %s',this.name,lockid,this.locks[0]);
  }
};

RuntimeVariable.prototype.clearLock = function(){
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime variable %s clearing lock',this.name);
  }
  while (this.locks.length > 0){
    var unlockid = this.locks.shift();
    platform.events.raise('runtime.unlock', unlockid);
    if (platform.configuration.debug.runtime === true){
      console.debug('runtime variable %s unlocked with id %s',this.name,unlockid);
    }
  }
  if (platform.configuration.debug.runtime === true){
    console.debug('runtime variable %s lock cleared',this.name);
  }
  return (this.locks.length === 0);
};

RuntimeVariable.prototype.isLocked = function(){
  return (this.locks.length > 0);
};

RuntimeVariable.prototype.getCurrentLock = function(){
  return this.locks[0];
};

platform.events.register('runtime.unlock',null,null,true);

runtime.set('maintenance',false);
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

runtime.get = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.get',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.getMeta = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.getmeta',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.getRevision = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.getrevision',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.tryGet = function(name,revision,callback){

  // normalizing arguments
  if (callback == null && typeof revision === 'function'){
    callback = revision;
    revision = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.tryget',{
    'name': name,
    'revision': revision
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.create = function(name){
  platform.cluster.ipc._send('runtime','runtime.create',{
    'name': name
  });

  return true;
};

runtime.set = function(name,value){
  platform.cluster.ipc._send('runtime','runtime.set',{
    'name': name,
    'value': value
  });

  return value;
};

runtime.setAwait = function(name,value,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.set',{
    'name': name,
    'value': value
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.trySet = function(name,value,revision,callback){

  // normalizing arguments
  if (callback == null && typeof revision === 'function'){
    callback = revision;
    revision = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.tryset',{
    'name': name,
    'value': value,
    'revision': revision
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.isUpdated = function(name,revision,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.isupdated',{
    'name': name,
    'revision': revision
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.subscribe = function(name,id,callback){

  // normalizing arguments
  if (callback == null && typeof id === 'function'){
    callback = id;
    id = null;
  }
  if (id == null){
    id = platform.cluster.worker.id;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.subscribe',{
    'name': name,
    'id': id
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.unsubscribe = function(name,id,callback){

  // normalizing arguments
  if (callback == null && typeof id === 'function'){
    callback = id;
    id = null;
  }
  if (id == null){
    id = platform.cluster.worker.id;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.unsubscribe',{
    'name': name,
    'id': id
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.isSubscribed = function(name,id,callback){

  // normalizing arguments
  if (callback == null && typeof id === 'function'){
    callback = id;
    id = null;
  }
  if (id == null){
    id = platform.cluster.worker.id;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.isSubscribed',{
    'name': name,
    'id': id
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.waitAndLock = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.waitandlock',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.lock = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.lock',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.unlock = function(name,lockid,callback){

  // normalizing arguments
  if (callback == null && typeof lockid === 'function'){
    callback = lockid;
    lockid = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.unlock',{
    'name': name,
    'lockid': lockid
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.clearLock = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.clearlock',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.isLocked = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.islocked',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

runtime.getCurrentLock = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc._send('runtime','runtime.getcurrentlock',{
    'name': name
  },function(error,result){
    if (error != null){
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

platform.events.register('runtime.update',null,null,true);

platform.cluster.ipc.protocols.register('runtime.update',function(client,data){
  // packet specification
  // {}.name: name of the variable to set
  // {}.value: value to set

  platform.events.raise('runtime.update',data.name,data.value);
},true);

if (platform.state === platform._states.PRELOAD) {
  platform.events.attach('cluster.init','runtime.set.priority',function(){
    platform.cluster.ipc.connections.runtime.priority = true;
  });

  platform.events.attach('runtime.update','cluster.variable.update',function(name,value){
    var strong_name = Object._runtime_map[name];
    var extended_descriptor = Object._property_store[strong_name];
    if (extended_descriptor != null){
      if (platform.configuration.debug.object.property.runtime === true) {
        console.debug('updating property %s to %s through runtime variable %s', strong_name,value,name);
      }
      Object._defineProperty._set_function(name,value,true);
    }
  });
}
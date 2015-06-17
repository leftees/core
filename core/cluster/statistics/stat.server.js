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

//TODO: implement abstract interface to allow further multiple/different backend support
/**
 * Provides statistics methods to create and collect performance counters.
 * @namespace
*/
platform.cluster.statistics = platform.cluster.statistics || {};

/**
 *  Stores the metrics instances by name.
*/
platform.cluster.statistics._store = platform.cluster.statistics._store || {};

platform.cluster.statistics._register = function(type,name,options,force){
  // checking whether a metric with same name has been registered
  if (platform.cluster.statistics.exists(name) === false) {
    //TODO: check if every method is implemented (interface?)
    // storing metric instance
    switch(type){
      case 'counter':
        platform.cluster.statistics._store[name] = new RemoteCounter();
        break;
      case 'meter':
        platform.cluster.statistics._store[name] = new RemoteMeter();
        break;
      case 'gauge':
        platform.cluster.statistics._store[name] = new RemoteGauge();
        break;
      //TODO: implement histograms and timers?
      default:
        throw new Exception('cluster metric of type %s is not supported',type);
        return false;
    }
    // extending with type/name
    platform.cluster.statistics._store[name].type = type;
    platform.cluster.statistics._store[name].name = name;

    //TODO: get value persistent across restart from storage

    return true;
  } else if (force === true && platform.cluster.statistics._store[name].type === type) {
    //TODO: merge options
  } else {
    throw new Exception('cluster metric %s already exists with type %s',name,type);
  }
};

platform.cluster.statistics._unregister = function(name){
  // checking if metric exists
  if (platform.cluster.statistics.exists(name) === true) {
    // deleting metric object
    return delete platform.cluster.statistics._store[name];
  } else {
    throw new Exception('cluster metric %s does not exist',name);
  }
};

//TODO: define standard specification for names (e.g. http.request.active)
platform.cluster.statistics.register = function(type,name,options,force,callback){

  // normalizing arguments
  if (callback == null && typeof force === 'function'){
    callback = force;
    force = null;
  }
  if (callback == null && typeof options === 'function'){
    callback = options;
    options = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // checking whether a metric with same name has been registered
  if (platform.cluster.statistics.exists(name) === true && force === false) {
    callback.reject(new Exception('cluster metric %s already exists with type %s',name,type));
  } else {

    /*if (platform.statistics.exists(name) === false) {
      platform.statistics.register(type, name, options);
    }
    platform.cluster.statistics._register(type, name, options);*/

    platform.cluster.ipc.sendAwait('*', 'statistics.register', {
      'type': type,
      'name': name,
      'options': options,
      'force': force
    }).then(callback.resolve, callback.reject);
  }

  return callback.promise;
};

platform.cluster.statistics.unregister = function(name,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // checking if metric exists
  if (platform.cluster.statistics.exists(name) === true) {
    /*if (platform.statistics.exists(name) === true) {
      platform.statistics.unregister(name);
    }
    platform.cluster.statistics._unregister(name);*/

    platform.cluster.ipc.sendAwait('*','statistics.unregister',{
      'name': name
    }).then(callback.resolve,callback.reject);
  } else {
    callback.reject(new Exception('cluster metric %s does not exist',name));
  }

  return callback.promise;
};

platform.cluster.statistics.exists = function(name){
  return (platform.cluster.statistics._store.hasOwnProperty(name));
};

platform.cluster.statistics.list = function(){
  var result = [];
  // adding backend objects to results by name
  Object.keys(platform.cluster.statistics._store).forEach(function(name){
    result.push(name);
  });
  return result;
};

platform.cluster.statistics.toJSON = async function(name,callback){

  // normalizing arguments
  if (callback == null && typeof name === 'function'){
    callback = name;
    name = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  if (name == null) {
    var result = {};
    var tasks = [];
    Object.keys(platform.cluster.statistics._store).forEach(function (name) {
      var metric = platform.cluster.statistics._store[name];
      tasks.push(function(task_callback) {
        metric.toJSON(function(err,task_result) {
          if (err) {
            result[name] = 'n/a';
            task_callback(err);
          } else {
            result[name] = task_result;
            task_callback();
          }
        });
      });
    });
    native.async.parallel(tasks,function(error){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });
  } else {
    // checking whether metrics exists and returning its instance
    if (platform.cluster.statistics.exists(name) === true) {
      platform.cluster.statistics._store[name].toJSON(function(error,result){
        if (error) {
          callback.reject(error);
        } else {
          callback.resolve(result);
        }
      });
    } else {
      callback.reject(new Exception('cluster metric %s not found', name));
    }
  }

  return callback.promise;
};

var RemoteMetric = function(options){
  // assuming performance counter/metric is registered in every app nodes with the same statement/options
};

RemoteMetric.prototype.toJSON = function(callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // requesting json to statistics node within the cluster
  platform.cluster.ipc.sendAwait('*','statistics.tojson',{
    'name': this.name
  },function(errors,results){
    if (results != null && results.succeed.length === results.destinations.length) {
      var result = {
        'value': 0,
        'min': 0,
        'max': 0
      };
      results.forEach(function(remote_result){
        if (remote_result != null) {
          result.value += remote_result.value;
          result.max += remote_result.max;
          if (result.min > remote_result.min){
            result.min = remote_result.min;
          }
        }
      });
      callback.resolve(result);
    } else {
      callback.reject();
    }
  });
};
var RemoteCounter = RemoteMetric;
var RemoteMeter = RemoteMetric;
var RemoteGauge = RemoteMetric;

platform.cluster.ipc.protocols.register('statistics.tojson',function(client,data,callback){
  // packet specification
  // {}.name

  // checking whether the callback exists (i.e. we're handling a duplex packet)
  try {
    callback(null,platform.statistics.toJSON(data.name));
  } catch (error) {
    callback(error);
  }
},true);

platform.cluster.ipc.protocols.register('statistics.register',function(client,data,callback){
  // packet specification
  // {}.type
  // {}.name
  // {}.options
  // {}.force

  // checking whether the callback exists (i.e. we're handling a duplex packet)
  try {
    if (platform.statistics.exists(data.name) === false) {
      platform.statistics.register(data.type,data.name,data.options,data.force)
    }
    if (platform.cluster.statistics.exists(data.name) === false) {
      platform.cluster.statistics._register(data.type,data.name,data.options,data.force)
    }
    callback();
  } catch (error) {
    callback(error);
  }
},true);

platform.cluster.ipc.protocols.register('statistics.unregister',function(client,data,callback){
  // packet specification
  // {}.name

  // checking whether the callback exists (i.e. we're handling a duplex packet)
  try {
    if (platform.statistics.exists(data.name) === true) {
      platform.statistics.unregister(data.name);
    }
    if (platform.cluster.statistics.exists(data.name) === true) {
      platform.cluster.statistics._unregister(data.name);
    }
    callback();
  } catch (error) {
    callback(error);
  }
},true);
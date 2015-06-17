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

/**
 * Contains cluster namespace with related objects and methods.
 * @namespace
*/
platform.cluster = platform.cluster || {};

/**
 * Contains cluster remote kernel helper methods.
 * @type {Object}
*/
platform.cluster.kernel = platform.cluster.kernel || {};

/**
 * Invokes a function in a remote cluster node.
 * @param {} destinations Specifies target cluster node(s) as string.
 * @param {} name Specifies the function to invoke in remote node as string (strong name).
 * @param {} [args] Specifies the arguments for the function.
 * @param {} [callback] Specifies the callback to be called when result/error is received.
*/
platform.cluster.kernel.invoke = function(destinations,name,args,callback){
  // normalizing arguments
  if (callback == null && typeof args === 'function'){
    callback = args;
    args = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  //TODO: serialize args?
  platform.cluster.ipc.sendAwait(destinations,'cluster.invoke',{
    'name': name,
    'args': args||[]
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};

// registering 'cluster.invoke' protocol to provide remote function call support
platform.cluster.ipc.protocols.register('cluster.invoke',function(client,data,callback){
  // packet specification
  // {}.name: strong-name to get and invoke
  // {}.args: array of arguments for the apply
  try {
    // checking whether the call target exists (strong name against global object)
    if (platform.kernel.exists(data.name) === true) {
      // getting target function
      var target = platform.kernel.get(data.name);
      // checking whether the target is a function
      if (typeof target !== 'function') {
        if (callback != null) {
          callback(new Exception('object %s is not a function in node %s', data.name, client.id));
        } else {
          // logging
          if (platform.configuration.debug.ipc === true) {
            console.warn('object %s is not a function in node %s', data.name, client.id);
          }
        }
      } else {
        //TODO: migrate to async property of functions (to support callback param injection)
        var result = target.apply(null, data.args);
        if (callback != null) {
          if (result != null && result.constructor === Promise) {
            result.then(function(result){
              callback(null,result);
            }).catch(function(error){
              callback(error);
            });
          } else {
            if (native.util.isError(result) === true) {
              callback(result);
            } else {
              callback(null,result);
            }
          }
        }
      }
    } else {
        if (callback != null) {
        callback(new Exception('object %s does not exists in node %s', data.name, client.id));
      } else {
        // logging
        if (platform.configuration.debug.ipc === true) {
          console.warn('object %s does not exists in node %s', data.name, client.id);
        }
      }
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught invoking %s in node %s: %s', data.name, client.id, err.message);
      }
    }
  }
},true);

/**
 * Gets the value of a strong-name in a remote cluster node.
 * @param {} destinations Specifies target cluster node(s) as string.
 * @param {} name Specifies the name of object to get in remote node as string (strong name).
 * @param {} [callback] Specifies the callback to be called when result/error is received.
*/
platform.cluster.kernel.get = function(destinations,name,callback) {
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'cluster.get',{
    'name': name
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};

// registering 'cluster.get' protocol to provide remote object get support
platform.cluster.ipc.protocols.register('cluster.get',function(client,data,callback){
  // packet specification
  // {}.name: strong-name to get

  try {
    // checking whether the target exists (strong name against global object)
    if (platform.kernel.exists(data.name) === true) {
      // getting target function
      var target = platform.kernel.get(data.name);
      // sending result whether the callback exists (i.e. we're handling a duplex packet)
      if (callback != null) {
        callback(null, target);
      }
    } else {
        if (callback != null) {
        callback(new Exception('object %s does not exists in node %s', data.name, client.id));
      } else {
        // logging
        if (platform.configuration.debug.ipc === true) {
          console.warn('object %s does not exists in node %s', data.name, client.id);
        }
      }
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught getting %s in node %s: %s', data.name, client.id, err.message);
      }
    }
  }
},true);

/**
 * Sets the value of a strong-name in a remote cluster node.
 * @param {} destinations Specifies target cluster node(s) as string.
 * @param {} name Specifies the name of object to set in remote node as string (strong name).
 * @param {} value Specifies the value to be set.
 * @param {} [create] Specifies whether missing tree part should be created as objects. Default is true.
 * @param {} [callback] Specifies the callback to be called when result/error is received.
*/
platform.cluster.kernel.set = function(destinations,name,value,create,callback) {
  // normalizing arguments
  if (callback == null && typeof create === 'function'){
    callback = create;
    create = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'cluster.set',{
    'name': name,
    'value': value,
    'create': create
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};

// registering 'cluster.set' protocol to provide remote object set support
platform.cluster.ipc.protocols.register('cluster.set',function(client,data,callback){
  // packet specification
  // {}.name: strong-name to be set
  // {}.value: value to set
  // {}.create: boolean whether to create missing parents

  try {
    // getting target function
    var target = platform.kernel.set(data.name,data.value,data.create);
    // sending result whether the callback exists (i.e. we're handling a duplex packet)
    if (callback != null) {
      callback(null, target);
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught setting %s in node %s: %s', data.name, client.id, err.message);
      }
    }
  }
},true);

/**
 * Deletes the value of a strong-name in a remote cluster node.
 * @param {} destinations Specifies target cluster node(s) as string.
 * @param {} name Specifies the name of object to delete in remote node as string (strong name).
 * @param {} [callback] Specifies the callback to be called when result/error is received.
*/
platform.cluster.kernel.unset = function(destinations,name,callback) {
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'cluster.unset',{
    'name': name
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};

// registering 'cluster.unset' protocol to provide remote object delete support
platform.cluster.ipc.protocols.register('cluster.unset',function(client,data,callback){
  // packet specification
  // {}.name: strong-name to unset

  try {
    // checking whether the target exists (strong name against global object)
    if (platform.kernel.exists(data.name) === true) {
      // deleting object function
      var result = platform.kernel.unset(data.name);
      // sending result whether the callback exists (i.e. we're handling a duplex packet)
      if (callback != null) {
        callback(null, result);
      }
    } else {
        if (callback != null) {
        callback(new Exception('object %s does not exists in node %s', data.name, client.id));
      } else {
        // logging
        if (platform.configuration.debug.ipc === true) {
          console.warn('object %s does not exists in node %s', data.name, client.id);
        }
      }
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught unsetting %s in node %s: %s', data.name, client.id, err.message);
      }
    }
  }
},true);

/**
 * Checks whether the strong-name exists in a remote cluster node.
 * @param {} destinations Specifies target cluster node(s) as string.
 * @param {} name Specifies the name of object to be checked in remote node as string (strong name).
 * @param {} [callback] Specifies the callback to be called when result/error is received.
*/
platform.cluster.kernel.exists = function(destinations,name,callback) {
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'cluster.exists',{
    'name': name
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};

// registering 'cluster.exists' protocol to provide remote object exist check support
platform.cluster.ipc.protocols.register('cluster.exists',function(client,data,callback){
  // packet specification
  // {}.name: strong-name to check

  try {
    // checking whether the target exists (strong name against global object)
    if (callback != null) {
      callback(null,platform.kernel.exists(data.name));
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught checking %s in node %s: %s', data.name, client.id, err.message);
      }
    }
  }
},true);

platform.cluster.kernel.wrap = function(destinations,name,recursive,onlyFunction,includePrivate,includeComputed,skipPaths,callback){
  // normalizing arguments
  if (callback == null && typeof skipPaths === 'function'){
    callback = skipPaths;
    skipPaths = null;
  }
  if (callback == null && typeof includeComputed === 'function'){
    callback = includeComputed;
    includeComputed = null;
  }
  if (callback == null && typeof includePrivate === 'function'){
    callback = includePrivate;
    includePrivate = null;
  }
  if (callback == null && typeof onlyFunction === 'function'){
    callback = onlyFunction;
    onlyFunction = null;
  }
  if (callback == null && typeof recursive === 'function'){
    callback = recursive;
    recursive = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'cluster.wrap',{
    'name': name,
    'recursive': recursive||false,
    'onlyFunction': onlyFunction||true,
    'includePrivate': includePrivate||false,
    'includeComputed': includeComputed||false,
    'skipPaths': skipPaths
  }).then(function(skeletons){
    try {
      if (Array.isArray(skeletons) === false) {
        skeletons = [skeletons];
      }
      //TODO: implement protocol injection to use hp _send for single destinations
      //TODO: find shared properties across all returned skeletons
      callback.resolve(JSON.unskeleton(skeletons[0], function (data,key,parent,path,wrapper,skip) {
        if (skeletons.length > 1 && path != null) {
          if (skeletons.every(function(skeleton){
              return platform.kernel.exists(path,skeleton);
            }) === false) {
            return skip;
          }
        }
        switch(data.type){
          case 'object':
            return {};
          case 'array':
            return [];
            break;
          case 'function':
            return (function(destinations,name){
              return (function() {
                return platform.cluster.kernel.invoke(destinations, name, Array.prototype.slice.call(arguments));
              });
            })(destinations,(path!=null)?(name+'.'+path):name);
            break;
          case 'class':
            //TODO: support class deserialization
            break;
          case 'reference':
            //TODO: support circular restore
            break;
          default:
            Object.defineProperty(parent,key,{
              'get': (function(destinations,name){
                return (async function(){
                  return await platform.cluster.kernel.get(destinations,name);
                });
              })(destinations,(path!=null)?(name+'.'+path):name),
              'set': (function(destinations,name){
                return (async function(value){
                  return await platform.cluster.kernel.set(destinations,name,value,false);
                });
              })(destinations,(path!=null)?(name+'.'+path):name)
            });
            return skip;
            break;
        }
        return skip;
      }));
    } catch(err){
      callback.reject(err)
    }
  },callback.reject);

  return callback.promise;
};

// registering 'cluster.wrap' protocol to provide remote object exist check support
platform.cluster.ipc.protocols.register('cluster.wrap',function(client,data,callback){
  // packet specification
  // {}.name: strong-name to wrap
  // {}.recursive: whether to wrap properties recursively
  // {}.onlyFunction:
  // {}.includePrivate: whether to wrap private named properties
  // {}.includeComputed: whether to wrap computed properties
  // {}.skipPaths:

  try {
    // checking whether the target exists (strong name against global object)
    if (callback != null) {
      callback(null,platform.kernel.skeleton(data.name,data.recursive,data.onlyFunction,data.includePrivate,data.includeComputed,data.skipPaths));
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught wrapping %s in node %s: %s', data.name, client.id, err.message);
      }
    }
  }
},true);
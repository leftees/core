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
 * Contains cluster IPC related objects and methods.
 * @namespace
*/
platform.cluster.ipc = platform.cluster.ipc || {};

/**
 * Contains cluster IPC extensible protocols objects and methods.
 * @namespace
*/
platform.cluster.ipc.protocols = platform.cluster.ipc.protocols || {};

/**
 * Stores registered IPC protocols.
 * @type {Object}
*/
platform.cluster.ipc.protocols._store = platform.cluster.ipc.protocols._store || {};

/**
 * Registers a new IPC protocol.
 * @param {} name Specifies the name of the new protocol.
 * @param {} callback Specifies the function to be invoked to process protocol-specific IPC packet.
 * @param {} [force] Specifies whether to overwrite pre-existent events. Default is false.
*/
platform.cluster.ipc.protocols.register = function(name,callback,force){
  // checking whether an protocol with same name has been registered
  if (platform.cluster.ipc.protocols.exists(name) === false || force === true) {
    platform.cluster.ipc.protocols._store[name] = new Protocol(name,callback);
  } else {
    throw new Exception('ipc protocol %s already exists',name);
  }
};

/**
 * Unregisters an IPC protocol.
 * @param {} name Specifies the name of the protocol.
 * @return {} Returns true if the protocol has been unregistered.
*/
platform.cluster.ipc.protocols.unregister = function(name){
  // checking if protocol exists
  if (platform.cluster.ipc.protocols.exists(name) === true) {
    delete platform.cluster.ipc.protocols._store[name];
    return true;
  } else {
    throw new Exception('ipc protocol %s does not exist',name);
  }
};

/**
 * Checks whether an IPC protocol is registered.
 * @param {} name Specifies the name of the protocol.
 * @return {} Returns true if the protocol exists.
*/
platform.cluster.ipc.protocols.exists = function(name){
  return (platform.cluster.ipc.protocols._store.hasOwnProperty(name));
};

/**
 * Lists the IPC protocols registered.
 * @return {} Returns an array of protocol names.
*/
platform.cluster.ipc.protocols.list = function(){
  return Object.keys(platform.cluster.ipc.protocols._store);
};

/**
 * Gets a protocol callback by name.
 * @param {} name Specifies the name of the protocol.
 * @return {} Returns the protocol callback.
*/
platform.cluster.ipc.protocols.get = function(name){
  // checking if protocol exists
  if (platform.cluster.ipc.protocols.exists(name) === true) {
    return platform.cluster.ipc.protocols._store[name];
  } else {
    throw new Exception('ipc protocol %s does not exist',name);
  }
};

/**
 * Processes IPC packet data through the specified packet.
 * @param {} name Specifies the name of the protocol.
 * @param {} client References the connection socket.
 * @param {} data References data of IPC packet.
 * @param {} callback References the function to be invoked with results in case of duplex packets).
*/
platform.cluster.ipc.protocols._process = function(name,client,data,callback){
  // checking if protocol exists
  if (platform.cluster.ipc.protocols.exists(name) === true) {
    var managed_callback_done = false;
    if (callback != null){
      try {
        var managed_callback = function (error, result) {
          if (managed_callback_done === false) {
            managed_callback_done = true;
            if (error != null) {
              if (platform.configuration.debug.ipc === true) {
                console.error('ipc exception in protocol %s for node %s: %s', name, client.id, error.stack || error.message);
                if (platform.configuration.debug.exception === true) {
                  console.dir(error);
                }
              }
              callback(error);
            } else {
              /*if (result != null && result.constructor === Promise) {
                result.then(function (result) {
                  callback(null, result);
                }, function (error) {
                  //if (platform.configuration.debug.ipc === true) {
                  console.error('ipc exception in protocol %s for node %s: %s', name, client.id, error.stack);
                  //}
                  callback(error);
                });
              } else {*/
                callback(null, result);
              //}
            }
          }
        };
        var duplex_result = platform.cluster.ipc.protocols._store[name].callback(client, data, managed_callback);
        if (managed_callback_done === false) {
          if (duplex_result != null && duplex_result.constructor === Promise) {
            /*duplex_result.then(function (result) {
              managed_callback_done = true;
              callback(null, result);
            }, function (error) {
              managed_callback_done = true;
              //if (platform.configuration.debug.ipc === true) {
                console.error('ipc exception in protocol %s for node %s: %s', name, client.id, error.stack);
              //}
              callback(error);
            });
          } else {*/
            managed_callback_done = true;
            callback(null, duplex_result);
          }
        }
      } catch(error) {
        if (managed_callback_done === false) {
          callback(error);
        }
        if (platform.configuration.debug.ipc === true) {
          console.error('ipc uncaught exception in protocol %s for node %s: %s', name, client.id, error.stack || error.message);
          if (platform.configuration.debug.exception === true) {
            console.dir(error);
          }
        }
      }
    } else {
      try {
        var simplex_result = platform.cluster.ipc.protocols._store[name].callback(client, data);
        if (simplex_result != null && simplex_result.constructor === Promise) {
          simplex_result.catch(function (error) {
            if (platform.configuration.debug.ipc === true) {
              console.error('ipc uncaught exception in protocol %s for node %s: %s', name, client.id, error.stack || error.message);
              if (platform.configuration.debug.exception === true) {
                console.dir(error);
              }
            }
          });
        }
      } catch(error) {
        if (platform.configuration.debug.ipc === true) {
          console.error('ipc uncaught exception in protocol %s for node %s: %s', name, client.id, error.stack || error.message);
          if (platform.configuration.debug.exception === true) {
            console.dir(error);
          }
        }
      }
    }
  } else {
    if (callback != null) {
      callback(new Exception('ipc protocol %s does not exist', name));
    } else {
      if (platform.configuration.debug.ipc === true) {
        console.error('ipc protocol %s does not exist', name);
      }
    }
  }
};

/**
 * Constructor for protocol class to be stored/registered.
*/
var Protocol = function(name,callback){
  this.name = name;
  this.callback = callback;
};
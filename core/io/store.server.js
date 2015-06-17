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
 * Provides IO helper with abstract filesystem and packaged module support.
 * @namespace
*/
platform.io = platform.io || {};

/**
 * Provides multistore IO support.
 * @namespace
*/
platform.io.store = platform.io.store || {};

/**
 *  Stores backend priorities for overlay abstract filesystem.
*/
platform.io.store._priorities = platform.io.store._priorities || [];

/**
 *  Stores backends objects and instances.
*/
platform.io.backends = platform.io.store._backends = platform.io.store._backends || {};

/**
 * Registers a new backend into multistore IO engine.
 * @param {} name Specifies the name of the new backend.
 * @param {} backend Specifies the new backend instance.
 * @param {} [priority] Specifies the priority for the new backend. If missing or negative, the backend is registered but not used in overlay abstract filesystem.
 * @param {} [force] Specifies whether to overwrite pre-existent events. Default is false.
 * @return {} Returns true if the backend is successfully registered.
 * @alert  Priority '0' and name 'root' are reserved for runtime backends.
*/
platform.io.store.register = function(name,backend,priority,force){
  // checking whether a backend with same name has been registered
  if (platform.io.store.exists(name) === false) {
    // sanitizing priority
    var newpriority = priority;
    if (typeof newpriority !== 'number'){
      newpriority = -1;
    } else if (newpriority < 0) {
      newpriority = -1;
    // preserving reserved backends
    } /*else if ((newpriority === 0 && name !== 'root') || (newpriority !== 0 && name === 'root')) {
      throw new Exception('store \'root\' with priority \'0\' cannot be modified');
    }*/

    //TODO: check if every method is implemented (interface?)
    // storing backend instance and extending it with name
    platform.io.store._backends[name] = backend;
    platform.io.store._backends[name].name = name;

    // storing backend priority
    if (newpriority > -1) {
      if (platform.io.store._priorities[newpriority] == null) {
        platform.io.store._priorities[newpriority] = name;
      } else {
        platform.io.store._priorities.splice(newpriority, 0, name);
      }
    }

    return true;
  } else if(force === true) {
    // storing backend instance and extending it with name
    platform.io.store._backends[name] = backend;
    platform.io.store._backends[name].name = name;

    // storing backend priority
    platform.io.store.setPriority(name,priority);
    return true;
  } else {
    throw new Exception('store %s already exists',name);
  }
};

/**
 * Unregisters a backend from multistore IO engine.
 * @param {} name Specifies the name of the backend.
 * @return {} Returns true if the backend has been unregistered.
 * @alert  Backend with name 'root' is reserved and can't be unregistered.
*/
platform.io.store.unregister = function(name){
  // checking if backend exists and is not reserved
  if (platform.io.store.exists(name) === true /*&& name !== 'root'*/) {
    // removing backend from priority array
    var oldindex = platform.io.store._priorities.indexOf(name);
    if (oldindex > -1) {
      platform.io.store._priorities.splice(oldindex, 1);
    }
    // deleting backend object
    return delete platform.io.store._backends[name];
  } else {
    throw new Exception('store %s does not exist',name);
  }
};

/**
 * Lists the backends registered in multistore IO engine.
 * @return {} Returns an array of backend names ordered by priority.
 * @alert  It doesn't include backends registered with no priority.
*/
platform.io.store.list = function(){
  var result = [];
  // adding backend objects to results by priority
  platform.io.store._priorities.forEach(function(name){
    result.push(platform.io.store._backends[name]);
  });
  return result;
};

/**
 * Lists all the backends registered.
 * @return {} Returns an array of backend instances.
 * @alert  It does include backends registered with no priority.
*/
platform.io.store.listAll = function(){
  var result = [];
  // adding backend objects to results by name
  Object.keys(platform.io.store._backends).forEach(function(name){
    result.push(platform.io.store._backends[name]);
  });
  return result;
};

/**
 * Checks whether the backend is registered.
 * @param {} name Specifies the name of the backend.
 * @return {} Returns true if the backend exists.
*/
platform.io.store.exists = function(name){
  return (platform.io.store._backends.hasOwnProperty(name));
};

/**
 * Gets a backend by name.
 * @param {} name Specifies the name of the backend.
 * @return {} Returns the backend instance.
*/
platform.io.store.getByName = function(name){
  // checking whether backend exists and returning its instance
  if (platform.io.store.exists(name) === true) {
    return platform.io.store._backends[name];
  } else {
    throw new Exception('store %s does not exist',name);
  }
};

/**
 * Gets a backend by priority.
 * @param {} priority Specifies the priority in multistore IO engine.
 * @return {} Returns the backend instance.
*/
platform.io.store.getByPriority = function(priority){
  // sanitizing priority
  var newpriority = priority;
  if (typeof newpriority !== 'number'){
    return null;
  } else if (newpriority < 0 || newpriority >= platform.io.store._priorities.length) {
    return null;
  }
  // getting name by priority
  var name = platform.io.store._priorities[newpriority];
  // checking whether the backend exists and returning it
  if (platform.io.store.exists(name) === true) {
    return platform.io.store._backends[name];
  } else {
    return null;
  }
};

/**
 * Gets the priority of a backend.
 * @param {} name Specifies the name of the backend.
 * @return {} Returns the priority of the backend.
*/
platform.io.store.getPriority = function(name){
  // checking whether backend exists and returning its priority
  if (platform.io.store.exists(name) === true) {
    return platform.io.store._priorities.indexOf(name);
  } else {
    throw new Exception('store %s does not exist',name);
  }
};

/**
 * Sets the priority of a backend.
 * @param {} name Specifies the name of the backend.
 * @param {} [priority] Specifies the priority for the new backend. If missing or negative, the backend is registered but not used in overlay abstract filesystem.
*/
platform.io.store.setPriority = function(name,priority){
  // checking whether backend exists
  if (platform.io.store.exists(name) === true) {
    // sanitizing priority
    var newpriority = priority;
    if (typeof newpriority !== 'number'){
      newpriority = -1;
    } else if (newpriority < 0) {
      newpriority = -1;
    // preserving reserved backends
    } /*else if (newpriority === 0 || name === 'root') {
      throw new Exception('store \'root\' with priority \'0\' cannot be modified');
    }*/
    // unsetting old priority
    var oldindex = platform.io.store._priorities.indexOf(name);
    if (oldindex > -1) {
      platform.io.store._priorities.splice(oldindex, 1);
    }
    // setting new priority (if any)
    if (newpriority > -1) {
      platform.io.store._priorities.splice(newpriority, 0, name);
    }
  } else {
    throw new Exception('store %s does not exist',name);
  }
};

// registering default root path runtime backends (this is reserved)
platform.io.store.register('root',platform.kernel.new('core.io.store.file',[ platform.configuration.runtime.path.root ]),0,true);
// registering default core path runtime backends
platform.io.store.register('core',platform.kernel.new('core.io.store.file',[ platform.configuration.runtime.path.core ]),1,true);

//TODO: support multiple backends by configuration
'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

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

//N: Provides IO helper with abstract filesystem and packaged module support.
platform.io = platform.io || {};

//N: Provides multistore IO support.
platform.io.store = platform.io.store || {};

//V: Stores backend priorities for overlay abstract filesystem.
platform.io.store.__priorities__ = [];

//V: Stores backends objects and instances.
platform.io.store.__backends__ = {};

//F: Registers a new backend into multistore IO engine.
//A: name: Specifies the name of the new backend.
//A: backend: Specifies the new backend instance.
//A: [priority]: Specifies the priority for the new backend. If missing or negative, the backend is registered but not used in overlay abstract filesystem.
//R: Returns true if the backend is successfully registered.
//H: Priority '0' and name 'app' are reserved for runtime backends.
platform.io.store.register = function(name,backend,priority){
  //C: checking whether a backend with same name has been registered
  if (platform.io.store.exist(name) === false) {
    //C: sanitizing priority
    var newpriority = priority;
    if (typeof newpriority !== 'number'){
      newpriority = -1;
    } else if (newpriority < 0) {
      newpriority = -1;
    //C: preserving reserved backends
    } /*else if ((newpriority === 0 && name !== 'app') || (newpriority !== 0 && name === 'app')) {
      throw new Exception('store \'app\' with priority \'0\' cannot be modified');
    }*/

    //T: check if every method is implemented (interface?)
    //C: storing backend instance and extending it with name
    platform.io.store.__backends__[name] = backend;
    platform.io.store.__backends__[name].name = name;

    //C: storing backend priority
    if (newpriority > -1) {
      platform.io.store.__priorities__.splice(newpriority, 0, name);
    }

    return true;
  } else {
    throw new Exception('class \'%s\' already exists',name);
  }
};

//F: Unregisters a backend from multistore IO engine.
//A: name: Specifies the name of the backend.
//R: Returns true if the backend has been unregistered.
//H: Backend with name 'app' is reserved and can't be unregistered.
platform.io.store.unregister = function(name){
  //C: checking if backend exists and is not reserved
  if (platform.io.store.exist(name) === true /*&& name !== 'app'*/) {
    //C: removing backend from priority array
    var oldindex = platform.io.store.__priorities__.indexOf(name);
    if (oldindex > -1) {
      platform.io.store.__priorities__.splice(oldindex, 1);
    }
    //C: deleting backend object
    return delete platform.io.store.__backends__[name];
  } else {
    throw new Exception('store \'%s\' does not exist',name);
  }
};

//F: Lists the backends registered in multistore IO engine.
//R: Returns an array of backend instances ordered by priority.
//H: It doesn't include backends registered with no priority.
platform.io.store.list = function(){
  var result = [];
  //C: adding backend objects to results by priority
  platform.io.store.__priorities__.forEach(function(name){
    result.push(platform.io.store.__backends__[name]);
  });
  return result;
};

//F: Lists all the backends registered.
//R: Returns an array of backend instances.
//H: It does include backends registered with no priority.
platform.io.store.listAll = function(){
  var result = [];
  //C: adding backend objects to results by name
  Object.keys(platform.io.store.__backends__).forEach(function(name){
    result.push(platform.io.store.__backends__[name]);
  });
  return result;
};

//F: Checks whether the backend is registered.
//A: name: Specifies the name of the backend.
//R: Returns true if the backend exists.
platform.io.store.exist = function(name){
  return (platform.io.store.__backends__.hasOwnProperty(name));
};

//F: Gets a backend by name.
//A: name: Specifies the name of the backend.
//R: Returns the backend instance.
platform.io.store.getByName = function(name){
  //C: checking whether backend exists and returning its instance
  if (platform.io.store.exist(name) === true) {
    return platform.io.store.__backends__[name];
  } else {
    throw new Exception('store \'%s\' not found',name);
  }
};

//F: Gets a backend by priority.
//A: priority: Specifies the priority in multistore IO engine.
//R: Returns the backend instance.
platform.io.store.getByPriority = function(priority){
  //C: sanitizing priority
  var newpriority = priority;
  if (typeof newpriority !== 'number'){
    return null;
  } else if (newpriority < 0 || newpriority >= platform.io.store.__priorities__.length) {
    return null;
  }
  //C: getting name by priority
  var name = platform.io.store.__priorities__[newpriority];
  //C: checking whether the backend exists and returning it
  if (platform.io.store.exist(name) === true) {
    return platform.io.store.__backends__[name];
  } else {
    return null;
  }
};

//F: Gets the priority of a backend.
//A: name: Specifies the name of the backend.
//R: Returns the priority of the backend.
platform.io.store.getPriority = function(name){
  //C: checking whether backend exists and returning its priority
  if (platform.io.store.exist(name) === true) {
    return platform.io.store.__priorities__.indexOf(name);
  } else {
    throw new Exception('store \'%s\' not found',name);
  }
};

//F: Sets the priority of a backend.
//A: name: Specifies the name of the backend.
//A: [priority]: Specifies the priority for the new backend. If missing or negative, the backend is registered but not used in overlay abstract filesystem.
platform.io.store.setPriority = function(name,priority){
  //C: checking whether backend exists
  if (platform.io.store.exist(name) === true) {
    //C: sanitizing priority
    var newpriority = priority;
    if (typeof newpriority !== 'number'){
      newpriority = -1;
    } else if (newpriority < 0) {
      newpriority = -1;
    //C: preserving reserved backends
    } /*else if (newpriority === 0 || name === 'app') {
      throw new Exception('store \'app\' with priority \'0\' cannot be modified');
    }*/
    //C: unsetting old priority
    var oldindex = platform.io.store.__priorities__.indexOf(name);
    if (oldindex > -1) {
      platform.io.store.__priorities__.splice(oldindex, 1);
    }
    //C: setting new priority (if any)
    if (newpriority > -1) {
      platform.io.store.__priorities__.splice(newpriority, 0, name);
    }
  } else {
    throw new Exception('store \'%s\' not found',name);
  }
};

//C: registering default app path runtime backends (this is reserved)
platform.io.store.register('app',platform.kernel.new('core.io.store.file',[ platform.runtime.path.app ]),0);
//C: registering default core path runtime backends
platform.io.store.register('core',platform.kernel.new('core.io.store.file',[ platform.runtime.path.core ]),1);

//T: support multiple backends by configuration

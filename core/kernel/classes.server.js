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

//N: Provides class helper to register/unregister and instance environment-level classes.
platform.classes = platform.classes || {};

//O: Stores the registered classes constructors.
platform.classes._store = platform.classes._store || {};

//F: Registers a class into current environment.
//A: name: Specifies name of new class to register.
//A: constructor: Specifies constructor with prototype object for new class instances.
//A: [replace]: Specifies whether existing constructor should be replaced instead of throwing exception. Default is false.
//R: Returns true if class is successfully registered.
platform.classes.register = function(name,constructor,replace){
  if (platform.classes.exist(name) === false || replace === true) {
    platform.classes._store[name] = constructor;
    return true;
  } else {
    throw new Exception('class %s already exists',name);
  }
};

//F: Unregisters a class from current environment.
//A: name: Specifies name of new class to unregister.
//R: Returns true if class is successfully unregistered.
platform.classes.unregister = function(name){
  if (platform.classes.exist(name) === true) {
    return delete platform.classes._store[name];
  } else {
    throw new Exception('class %s does not exist',name);
  }
};

//F: Gets a class constructor from current environment.
//A: name: Specifies name of new class to get.
//R: Returns class constructor.
platform.classes.get = function(name){
  if (platform.classes.exist(name) === true) {
    return platform.classes._store[name];
  } else {
    throw new Exception('constructor for %s not found',name);
  }
};

platform.classes.list = function(){
  return Object.keys(platform.classes._store);
};

//F: Checks whether a class is registered in current environment.
//A: name: Specifies name of new class to check.
//R: Returns true if class is registered.
platform.classes.exist = function(name){
  return (platform.classes._store.hasOwnProperty(name) && typeof platform.classes._store[name] === 'function');
};

//F: Checks whether an object is an instance of a registered class in current environment.
//A: object: Specifies object to check.
//A: name: Specifies name of class to compare.
//R: Returns true if object is an instance of specified class.
platform.classes.instanceOf = function(object,name){
  return (object != null && platform.classes._store.hasOwnProperty(name) === true && platform.classes._store[name] === object.constructor);
};
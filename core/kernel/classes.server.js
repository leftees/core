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
 * Provides class helper to register/unregister and instance environment-level classes.
 * @namespace
*/
platform.classes = platform.classes || {};

/**
 * Stores the registered classes constructors.
 * @type {Object}
*/
platform.classes._store = platform.classes._store || {};

/**
 * Registers a class into current environment.
 * @param {} name Specifies name of new class to register.
 * @param {} constructor Specifies constructor with prototype object for new class instances.
 * @param {} [force] Specifies whether to overwrite pre-existent events. Default is false.
 * @return {} Returns true if class is successfully registered.
*/
platform.classes.register = function(name,constructor,force){
  if (platform.classes.exists(name) === false || force === true) {
    platform.classes._store[name] = constructor;
    return true;
  } else {
    throw new Exception('class %s already exists',name);
  }
};

/**
 * Unregisters a class from current environment.
 * @param {} name Specifies name of class to unregister.
 * @return {} Returns true if class is successfully unregistered.
*/
platform.classes.unregister = function(name){
  if (platform.classes.exists(name) === true) {
    return delete platform.classes._store[name];
  } else {
    throw new Exception('class %s does not exist',name);
  }
};

/**
 * Gets a class constructor from current environment.
 * @param {} name Specifies name of class to get.
 * @return {} Returns class constructor.
*/
platform.classes.get = function(name){
  if (platform.classes.exists(name) === true) {
    return platform.classes._store[name];
  } else {
    throw new Exception('constructor for %s not found',name);
  }
};

platform.classes.list = function(){
  return Object.keys(platform.classes._store);
};

/**
 * Checks whether a class is registered in current environment.
 * @param {} name Specifies name of class to check.
 * @return {} Returns true if class is registered.
*/
platform.classes.exists = function(name){
  return (platform.classes._store.hasOwnProperty(name) && typeof platform.classes._store[name] === 'function');
};

/**
 * Checks whether an object is an instance of a registered class in current environment.
 * @param {} object Specifies object to check.
 * @param {} name Specifies name of class to compare.
 * @return {} Returns true if object is an instance of specified class.
*/
platform.classes.instanceOf = function(object,name){
  return (object != null && platform.classes._store.hasOwnProperty(name) === true && platform.classes._store[name] === object.constructor);
};

/**
 * Gets a class prototype from current environment.
 * @param {} name Specifies name of class to get.
 * @return {} Returns class prototype.
*/
platform.classes.getPrototype = function(name){
  if (platform.classes.exists(name) === true) {
    return platform.classes._store[name].prototype;
  } else {
    throw new Exception('constructor for %s not found',name);
  }
};

/**
 * Create a new instance from classes defined in current environment.
 * @function platform.kernel.new
 * @param {} name Specifies name of class to instance.
 * @param {} [args] Specifies the arguments for the instance constructor.
 * @param {} [root] Specifies which object should be use as root to get property value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the name property tree. Default is '.'.
 * @return {} Returns the new instance of required class.
 * @alert  While traversing the property tree every get() property function will be evaluated if any.
 * @alert  If no custom root is specified, this function will try to instance registered classes through platform.classes.
*/
platform.kernel.new = function (name,args,root,divisor) {
  var target = null;
  var new_instance = null;

  // looking for registered class if no root has been specified
  if (root == null) {
    if (platform.classes.exists(name) === true) {
      target = platform.classes.get(name);
    }
  }

  // trying to resolve strong-name if root has been specified or class is not registered
  if (target == null){
    try{
      var found = platform.kernel._find(name,root,divisor,false,false);
      target = found.target;
    } catch(err){
      throw new Exception(err, 'unable to instance class %s',name);
    }
  }

  // creating new class instance
  new_instance = Object.create(target.prototype);
  target.apply(new_instance, args);
  return new_instance;
};
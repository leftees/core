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

//N: Provides kernel functions to execute and manage environment.
platform.kernel = platform.kernel || {};

//F: Gets the value of a property in current environment.
//A: name: Specifies name of property to be returned.
//A: [root]: Specifies which object should be use as root to get property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns the value of property.
//H: While traversing the property tree every get() property function will be evaluated if any.
platform.kernel.get = function(name,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  if (target == null){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length; count++) {
    subname = tree [count];
    if (subname === '')
      continue;
    if (target [subname] == null) {
      throw new Exception('unable to get %s: member %s does not exist',name,subname);
    }
    target = target [subname];
  }
  return target;
};

//F: Sets the value of a property in current environment.
//A: name: Specifies name of property to be set.
//A: value: Specifies the value to be set.
//A: [create]: Specifies whether missing tree part should be created as objects. Default is true.
//A: [root]: Specifies which object should be use as root to set property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns the value of property.
//H: While traversing the property tree every get() property function and set() property function leaf will be evaluated if any.
platform.kernel.set = function(name,value,create,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  if (target == null){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length-1; count++) {
    if (subname === '')
      continue;
    subname = tree [count];
    if (target [subname] == null) {
      if (create === false) {
        throw new Exception('unable to set %s: member %s does not exist',name,subname);
      } else {
        target [subname] = {};
      }
    }
    target = target [subname];
  }
  subname = tree [tree.length-1];
  target [subname] = value;
  return target [subname];
};

//F: Deletes the value of a property in current environment.
//A: name: Specifies name of property to be unset.
//A: [root]: Specifies which object should be use as root to set property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns true if property has been successfully deleted.
//H: While traversing the property tree every get() property function will be evaluated if any.
//H: The unset is implemented through ECMAScript delete operator.
platform.kernel.unset = function(name,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  if (target == null){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length-1; count++) {
    subname = tree [count];
    if (subname === '')
      continue;
    if (target [subname] == null) {
      throw new Exception('unable to unset %s: member %s does not exist',name,subname);
    }
    target = target [subname];
  }
  subname = tree [tree.length-1];
  if (target [subname] != null) {
    //T: clean augmented data if any
    return (delete target [subname]);
  }
  throw new Exception('unable to unset %s: member %s does not exist',name,subname);
};

//F: Invokes a function in current environment.
//A: name: Specifies name of property to invoke.
//A: [args]: Specifies the arguments for the function.
//A: [scope]: Specifies which object should be use as scope to get property value. Default is global.
//A: [root]: Specifies which object should be use as root to get property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns the returned value of invoked function.
//H: While traversing the property tree every get() property function will be evaluated if any.
platform.kernel.invoke = function(name,args,scope,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  if (target == null){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length; count++) {
    subname = tree [count];
    if (subname === '')
      continue;
    if (target [subname] == null) {
      throw new Exception('unable to invoke %s: member %s does not exist',name,subname);
    }
    target = target [subname];
  }
  if (typeof target === 'function') {
    return target.apply(scope,args);
  } else {
    throw new Exception('unable to invoke %s: member %s is not a function',name,subname);
  }
};

//F: Create a new instance from classes defined in current environment.
//A: name: Specifies name of class to instance.
//A: [args]: Specifies the arguments for the instance constructor.
//A: [root]: Specifies which object should be use as root to get property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns the new instance of required class.
//H: While traversing the property tree every get() property function will be evaluated if any.
//H: If no custom root is specified, this function will try to instance registered classes through platform.classes.
platform.kernel.new = function (name,args,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  var new_instance;

  //C: looking for registered class names if no root has been specified
  if (target == null) {
    if (platform.classes.exist(name) === true) {
      target = platform.classes.get(name);
      new_instance = Object.create(target.prototype);
      target.apply(new_instance, args);
      return new_instance;
    } else {
      target = global;
    }
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length; count++) {
    subname = tree [count];
    if (subname === '')
      continue;
    if (target [subname] == null) {
      throw new Exception('unable to instance class %s: member %s does not exist',name,subname);
    }
    target = target [subname];
  }
  new_instance = Object.create(target.prototype);
  target.apply(new_instance,args);
  return new_instance;
};

platform.kernel.exist = function(name,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  if (target == null){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length-1; count++) {
    subname = tree [count];
    if (subname === '')
      continue;
    if (target [subname] == null) {
      return false;
    }
    target = target [subname];
  }
  subname = tree [tree.length-1];
  return target.hasOwnProperty(subname);
};
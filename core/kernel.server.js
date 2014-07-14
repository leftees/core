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
  if (target === undefined){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length; count++) {
    subname = tree [count];
    if (target [subname] === undefined) {
      throw new Error("Unable to get \"" + name + "\": member \"" + subname + "\" doesn't exists.");
    }
    target = target [subname];
  }
  return target;
};

//F: Sets the value of a property in current environment.
//A: name: Specifies name of property to be set.
//A: value: Specifies the value to be set.
//A: [root]: Specifies which object should be use as root to set property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns the value of property.
//H: While traversing the property tree every get() property function and set() property function leaf will be evaluated if any.
platform.kernel.set = function(name,value,createParents,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  if (target === undefined){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length-1; count++) {
    subname = tree [count];
    if (target [subname] === undefined) {
      throw new Error("Unable to set \"" + name + "\": member \"" + subname + "\" doesn't exists.");
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
  if (target === undefined){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length-1; count++) {
    subname = tree [count];
    if (target [subname] === undefined) {
      throw new Error("Unable to unset \"" + name + "\": member \"" + subname + "\" doesn't exists.");
    }
    target = target [subname];
  }
  subname = tree [tree.length-1];
  if (target [subname] !== undefined) {
    //T: clean augmented data if any
    return (delete target [subname]);
  }
  throw new Error("Unable to unset \"" + name + "\": member \"" + subname + "\" doesn't exists.");
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
  if (target === undefined){
    target = global;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length; count++) {
    subname = tree [count];
    if (target [subname] === undefined) {
      throw new Error("Unable to invoke \"" + name + "\": member \"" + subname + "\" doesn't exists.");
    }
    target = target [subname];
  }
  if (typeof target === 'function') {
    return target.apply(scope,args);
  } else {
    throw new Error("Unable to invoke \"" + name + "\": it is not a function.");
  }
};

//F: Invokes a function in current environment.
//A: name: Specifies name of property to invoke.
//A: [args]: Specifies the arguments for the function.
//A: [scope]: Specifies which object should be use as scope to get property value. Default is global.
//A: [root]: Specifies which object should be use as root to get property value. Default is global.
//A: [divisor]: Specifies which char/string should be used split the name property tree. Default is '.'.
//R: Returns the returned value of invoked function.
//H: While traversing the property tree every get() property function will be evaluated if any.
platform.kernel.new = function (name,args,revision,root,divisor) {
  var target = root;
  var subname;
  var tree;
  var count;
  var new_instance;
  if (target === undefined){
    target = platform.classes;
  }

  subname = null;
  tree = name.split (divisor||'.');
  for (count = 0; count < tree.length; count++) {
    subname = tree [count];
    if (target [subname] === undefined) {
      //T: check in global if root is not specified and find fails
      throw new Error("Unable to instance new \"" + name + "\": member \"" + subname + "\" doesn't exists.");
    }
    target = target [subname];
  }
  new_instance = Object.create(target.prototype);
  target.apply(new_instance,args);
  return new_instance;
};

//F: Injects Javascript code to current environment.
//A: code: Specifies Javascript code to be injected.
//A: [file]: Specifies the file name containing code to be injected.
//A: [module]: Specifies name of the module that is injecting code
//A: [preprocess]: Specifies whether the code should be augmented before injection. Default is true.
//R: Returns the return value from injected code.
//H: Temporary implementation uses the global.eval function, it will be replaced with global.require to support debuggers.
platform.kernel.inject = function (code,file,module,preprocess) {
  var preprocessed_code;
  if (preprocess === true && platform.kernel.preprocess !== undefined && typeof platform.kernel.preprocess === 'function') {
    preprocessed_code = platform.kernel.preprocess(code,module,file);
  } else {
    preprocessed_code = code;
  }
  return global.eval.call(global,preprocessed_code);
};

//F: Injects Javascript code to current environment.
//A: file: Specifies the file name containing code to be injected.
//A: [module]: Specifies name of the module that is injecting code
//A: [preprocess]: Specifies whether the code should be augmented before injection. Default is true.
//R: Returns the return value from injected code.
//H: This function will resolve paths, augment code if requested, cache and inject into current environment.
platform.kernel.load = function(file,module,preprocess) {
  //T: implement kernel load function (requires io/cache helper)
};
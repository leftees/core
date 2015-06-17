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
 * Provides kernel functions to execute and manage environment.
 * @namespace
*/
platform.kernel = platform.kernel || {};

/**
 * Gets the value of a strong-name in current environment.
 * @param {} name Specifies name of strong-name to be returned.
 * @param {} [root] Specifies which object should be use as root to get strong-name value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the strong-name tree. Default is '.'.
 * @return {} Returns the value of strong-name.
 * @alert  While traversing the strong-name tree every get() property function will be evaluated if any.
*/
platform.kernel.get = function(name,root,divisor) {
  try{
    var found = platform.kernel._find(name,root,divisor,false,false);
    return found.target;
  } catch(err){
    throw new Exception(err,'unable to get %s',name);
  }
};

/**
 * Sets the value of a strong-name in current environment.
 * @param {} name Specifies name of strong-name to be set.
 * @param {} value Specifies the value to be set.
 * @param {} [create] Specifies whether missing tree part should be created as objects. Default is true.
 * @param {} [root] Specifies which object should be use as root to set strong-name value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the strong-name tree. Default is '.'.
 * @return {} Returns the value of strong-name.
 * @alert  While traversing the strong-name tree every get() property function and set() property function leaf will be evaluated if any.
*/
platform.kernel.set = function(name,value,create,root,divisor) {
  try{
    var found = platform.kernel._find(name,root,divisor,(create==null)?true:create,true);
    var parent = found.parent;
    var key = found.key;
    parent [key] = value;
    return parent [key];
  } catch(err){
    throw new Exception(err,'unable to set %s',name);
  }
};

/**
 * Deletes the value of a strong-name in current environment.
 * @param {} name Specifies name of strong-name to be unset.
 * @param {} [root] Specifies which object should be use as root to set strong-name value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the strong-name tree. Default is '.'.
 * @return {} Returns true if strong-name has been successfully deleted.
 * @alert  While traversing the strong-name tree every get() property function will be evaluated if any.
 * @alert  The unset is implemented through ECMAScript delete operator.
*/
platform.kernel.unset = function(name,root,divisor) {
  try{
    var found = platform.kernel._find(name,root,divisor,false,true);
    var parent = found.parent;
    var key = found.key;
    if (parent [key] !== undefined) {
      //TODO: clean augmented data if any
      return (delete parent [key]);
    } else {
      return true;
    }
  } catch(err){
    throw new Exception(err,'unable to unset %s',name);
  }
};

/**
 * Invokes a function in current environment.
 * @param {} name Specifies name of strong-name to invoke.
 * @param {} [args] Specifies the arguments for the function.
 * @param {} [scope] Specifies which object should be use as scope to get strong-name value. Default is global.
 * @param {} [root] Specifies which object should be use as root to get strong-name value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the strong-name tree. Default is '.'.
 * @return {} Returns the returned value of invoked function.
 * @alert  While traversing the strong-name tree every get() property function will be evaluated if any.
*/
platform.kernel.invoke = function(name,args,scope,root,divisor) {
  try{
    var found = platform.kernel._find(name,root,divisor,false,false);
    var target = found.target;
    if (typeof target === 'function') {
      return target.apply(scope,args);
    } else {
      throw new Exception('unable to invoke %s: not a function',name);
    }
  } catch(err){
    throw new Exception(err,'unable to invoke %s',name);
  }
};

/**
 * Checks whether the strong-name exists in current environment.
 * @param {} name Specifies name of strong-name to be checked.
 * @param {} [root] Specifies which object should be use as root to get strong-name value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the strong-name tree. Default is '.'.
 * @return {} Returns true if exists, otherwise returns false.
 * @alert  While traversing the strong-name tree every get() property function will be evaluated if any.
*/
platform.kernel.exists = function(name,root,divisor) {
  try {
    var found = platform.kernel._find(name,root,divisor,false,true);
    var parent = found.parent;
    var key = found.key;
    return parent.hasOwnProperty(key);
  } catch(err){
  }
  return false;
};

/**
 * Helps to get value of a strong-name in current environment.
 * @param {} name Specifies name of strong-name to be returned.
 * @param {} [root] Specifies which object should be use as root to get strong-name value. Default is global.
 * @param {} [divisor] Specifies which char/string should be used split the strong-name tree. Default is '.'.
 * @param {} [create] Specifies whether missing tree part should be created as objects. Default is false.
 * @param {} [parentOnly] Specifies whether to return parent object with key to access to the strong-name value.
 * @return {} Returns a new object with the value of strong-name as 'target' property or, if parentOnly is true, an object with the parent object as 'parent' and the key to get the target as 'key'.
 * @alert  While traversing the strong-name tree every get() property function will be evaluated if any.
*/
platform.kernel._find = function(name,root,divisor,create,parentOnly){
  var target = root;
  var subname;
  var tree;
  var count;
  // referencing the global scope if root (target) is not defined
  if (target == null){
    target = global;
  }
  subname = null;
  // splitting the strong-name
  tree = name.split (divisor||'.');
  // defining the depth for object tree navigation
  var depth = (parentOnly === true) ? (tree.length-1) : tree.length;
  // navigating the object tree
  for (count = 0; count < depth; count++) {
    // getting next property key
    subname = tree [count];
    // skipping empty properties (leftovers?)
    if (subname === '')
      continue;
    // checking whether the next object is available for navigation
    if (target [subname] == null) {
      // creating object if requested or throwing exception
      if (create === true) {
        target [subname] = {};
      } else {
        throw new Exception('member %s does not exist',subname);
      }
    }
    // reference new parent or target
    target = target [subname];
  }

  // creating and returning object for results
  var result = {};
  if (parentOnly === true){
    result.parent = target;
    result.key = tree [tree.length-1];
  } else {
    result.target = target;
  }
  return result;
};

platform.kernel.skeleton = function(name,recursive,onlyFunction,includePrivate,includeComputed,skipPaths,root,divisor) {
  try{
    var found = platform.kernel._find(name,root,divisor,false,false);
    return JSON.skeleton(found.target,recursive,onlyFunction,includePrivate,includeComputed,skipPaths);
  } catch(err){
    throw new Exception(err,'unable to get %s',name);
  }
};

platform.kernel._debugger = platform.kernel._debugger || {};

#preprocessor.disable('exception_dump'):
platform.kernel._debugger.getExceptionLocationFromStack = function(stack){
  var last_stack = (/\n\s*?at.*?\n/gi).exec(stack)[0];
  var raw_location_parts = (/(\/{0,1}(([\w\.]|(\\ ))+\/)*([\w\.]|(\\ ))+)\:(\d+)\:(\d+)/).exec(last_stack);
  return {
    'file': raw_location_parts[1],
    'line': parseInt(raw_location_parts[raw_location_parts.length-2]),
    'column': parseInt(raw_location_parts[raw_location_parts.length-1])-1
  };
};

#preprocessor.disable('exception_dump'):
platform.kernel._debugger.getBlockFromLocation = function(fileOrObject, line, column) {
  var file;
  if (typeof fileOrObject === 'object') {
    file = fileOrObject.file;
    line = fileOrObject.line;
    column = fileOrObject.column;
  } else {
    file = fileOrObject;
  }

  var meta_file = file.replace(platform.io.backends.root.base,platform.io.backends.build.base) + '.meta';
  if (platform.io.backends.system.existsSync(meta_file) === true) {
    file = meta_file;
  }

  var result = {};
  result.position = {};
  result.position.line = line;
  result.position.column = column+1;
  if (platform.io.backends.system.existsSync(file) === true) {
    var code = platform.io.backends.system.get.stringSync(file);
    var comments = [];
    var tokens = [];
    var ast = native.parser.js.parse(code, {
      'allowImportExportEverywhere': false,
      'allowReturnOutsideFunction': true,
      'ecmaVersion': 7,
      'playground': false,
      'strictMode': false,
      'onComment': comments,
      'locations': true,
      'onToken': tokens,
      'ranges': true,
      'preserveParens': false,
      'sourceFile': file
    });
    native.parser.js.merge(ast, comments, tokens);
    var previous = ast;
    var found = null;
    native.parser.js.traverse(ast,{
      'enter': function(child_node,parent) {
        if (found == null) {
          if (child_node.loc.start.line === line && child_node.loc.start.column >= column ||
            child_node.loc.start.line > line) {
            line = child_node.loc.start.line;
            column = child_node.loc.start.column;
            found = child_node;
          }
        }
        previous = child_node;
      }
    });
    if (found != null) {
      result.code = native.parser.js.codegen(found);
    }
    try {
      result.line = String.getLines(code, line, line);
    } catch(e){}
    result.position.line = line;
    result.position.column = column+1;
  }
  return result;
};
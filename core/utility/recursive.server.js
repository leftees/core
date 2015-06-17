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
 * Provides utility and functions to support development and execution.
 * @namespace
*/
platform.utility = platform.utility || {};

/**
 * Processes a function recursively for each element in specified object tree preventing maximum call stack exceed.
 * @param {} leaf_callback Specifies which function to call for each element in the object tree.
 * @param {} [end_callback] Specifies which function to call after the whole tree has been processed.
 * @param {} rootObject Specifies the element containing the whole object tree.
 * @param {} [...] Unhardcoded pass-through arguments to push when calling CallFunction.
*/
platform.utility.recursiveCallH = function (leaf_callback,end_callback,root) {
  var pending = [];
  // getting array object from arguments custom object extending Array.prototype
  var invoke_arguments = Array.prototype.slice.call(arguments);
  // adding root object to pending queue
  pending.push(invoke_arguments[2]);
  // removing RecursiveCall specific arguments (RootObject, CallFunction, CompleteFunction)
  invoke_arguments.shift();
  invoke_arguments.shift();
  invoke_arguments.shift();
  // processing pending queue until is empty
  do {
    // calling specified function with current pending object, as first argument, and pass-through arguments (sanitizing returned values to empty array if null)
    var pendingArray = leaf_callback.apply(this,[pending[0]].concat(invoke_arguments)) || [];
    // cleaning current processed object
    pending.shift();
    // extending pending queue to vertically traverse
    if (pendingArray.constructor === Array) {
      pending = pendingArray.concat(pending);
    }
  } while (pending.length);
  // executing CompleteFunction if not null
  if (end_callback != null) {
    end_callback.apply(this,invoke_arguments);
  }
};

/**
 * Processes a function recursively for each element in specified object tree preventing maximum call stack exceed.
 * @param {} leaf_callback Specifies which function to call for each element in the object tree.
 * @param {} [end_callback] Specifies which function to call after the whole tree has been processed.
 * @param {} rootObject Specifies the element containing the whole object tree.
 * @param {} [...] Unhardcoded pass-through arguments to push when calling CallFunction.
*/
platform.utility.recursiveCallV = function (leaf_callback,end_callback,root) {
  var pending = [];
  // getting array object from arguments custom object extending Array.prototype
  var invoke_arguments = Array.prototype.slice.call(arguments);
  // adding root object to pending queue
  pending.push(invoke_arguments[2]);
  // removing RecursiveCall specific arguments (RootObject, CallFunction, CompleteFunction)
  invoke_arguments.shift();
  invoke_arguments.shift();
  invoke_arguments.shift();
  // processing pending queue until is empty
  do {
    // calling specified function with current pending object, as first argument, and pass-through arguments (sanitizing returned values to empty array if null)
    var pendingArray = leaf_callback.apply(this,[pending[0]].concat(invoke_arguments)) || [];
    // cleaning current processed object
    pending.shift();
    // extending pending queue to vertically traverse
    if (pendingArray.constructor === Array) {
      pending = pending.concat(pendingArray);
    }
  } while (pending.length);
  // executing CompleteFunction if not null
  if (end_callback != null) {
    end_callback.apply(this,invoke_arguments);
  }
};
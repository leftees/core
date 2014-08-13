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

//N: Provides utility and functions to support development and execution.
platform.utility = platform.utility || {};

//F: Processes a function recursively for each element in specified object tree preventing maximum call stack exceed.
//A: leafCallback: Specifies which function to call for each element in the object tree.
//A: [endCallback]: Specifies which function to call after the whole tree has been processed.
//A: rootObject: Specifies the element containing the whole object tree.
//A: [...]: Unhardcoded pass-through arguments to push when calling CallFunction.
platform.utility.recursiveCall = function (leafCallback,endCallback,root) {
  var pendingObjects = [];
  //C: getting array object from arguments custom object extending Array.prototype
  var argumentsArray = Array.prototype.slice.call(arguments);
  //C: adding root object to pending queue
  pendingObjects.push(argumentsArray[2]);
  //C: removing RecursiveCall specific arguments (RootObject, CallFunction, CompleteFunction)
  argumentsArray.shift();
  argumentsArray.shift();
  argumentsArray.shift();
  //C: processing pending queue until is empty
  do {
    //C: calling specified function with current pending object, as first argument, and pass-through arguments (sanitizing returned values to empty array if null)
    var pendingArray = leafCallback.apply(null,[pendingObjects[0]].concat(argumentsArray)) || [];
    if (pendingArray.constructor === Array) {
      //C: extending pending queue
      pendingObjects = pendingObjects.concat(pendingArray);
    }
    //C: cleaning current processed object
    pendingObjects.shift();
  } while (pendingObjects.length);
  //C: executing CompleteFunction if not null
  if (endCallback != null) {
    endCallback.apply(null,argumentsArray);
  }
};
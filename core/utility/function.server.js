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
 * Gets the arguments of a function.
 * @param {} target Specifies the function object within retrieve arguments.
 * @return {} Returns the arguments name of a function, as array of string.
*/
Function.info = Function.info || {};
Function.info.arguments = function(target) {
  var result = target.toString().match(/[^\0]*?(?=\))/g)[0].replace(/[^\0]*?\(|\s/g,'').split(',');
  if (result.length != 0) {
    // workaround for chrome 20.0.15
    if (result[result.length-1] == '/**/') {
      result.pop();
    }
  }
  if (result.length == 1 && result[0] == "")
    return [];
  else
    return result;
};

/**
 * Get the inner code of this function.
 * @param {} target Specifies the function object from which to retrieve the code.
 * @param {} [compact] Specifies whether to return compacted (single line).
 * @return {} Returns the inner code of a function, as string.
*/
Function.info.code = function(target, compact) {
  var code = target.toString();
  code = code.slice(code.indexOf('{')+1,code.lastIndexOf('}')-1);
  if (compact === true){
    code = code.replace(/[\n\r]/gi,'');
  }
  return code;
};
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

//N: Provides environment management classes and methods.
platform.environment = platform.environment || {};

//O: Stores the files loaded inside the execution environment (both  server/client side)
//H: Files are pushed with relative path as passed to platform.environment.load.
platform.environment._files = platform.environment._files || [];

//F: Loads a file into the execution environment.
//A: path: Specifies the path of the file to be loaded.
//A: [module]: Specifies the module name requiring the file.
//H: The file type is automatically detect by extension for proper loading.
platform.environment.load = function(path,module){
  //T: support modular/extensible file type support
  if (platform.environment._files.indexOf(path) === -1) {
    platform.environment._files.push(path);
  }

  return platform.kernel.load(path,module);
};
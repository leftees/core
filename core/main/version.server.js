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

//C: defining version CLI command
global.main.commands.version = function(){
  //C: printing logo
  global.main.commands.logo();
  //C: printing version
  global.main.commands.version.print();
};

//C: prints the app, node and other significant versions
global.main.commands.version.print = function(){
  //T: print versions through component list
  console.log('ljve: %s', global.require('./package.json').version);
  console.log('node: %s',process.versions.node);
  console.log('v8: %s',process.versions.v8);
  console.log('uv: %s',process.versions.uv);
  console.log('openssl: %s',process.versions.openssl);
  console.log('zlib: %s',process.versions.zlib);
};

//C: defining version CLI command manual
global.main.commands.version.man = function() {
  console.log('\
  Print application and runtime version.');
};
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

//C: creating temporary main namespace for modular CLI command support
global.main = {};

//C: storing root paths
global.main.path = {};
global.main.path.app = process.cwd();
global.main.path.core = require('path').dirname(require.main.filename);

//C: detecting whether Node is running as development environment
global.development = false;
if (process.env.NODE_ENV === 'development') {
  global.development = true;
}

//C: detecting whether Node is running as debugging environment
global.debugging = false;
//C: detecting whether debugger is running through node args
process.execArgv.forEach(function(arg) {
  if (arg.indexOf('--debug') === 0 || arg.indexOf('debug') === 0){
    global.debugging = true;
    global.development = true;
  }
});
//C: detecting whether debugger should run because of environment
if (process.env.NODE_ENV === 'debugging') {
  if (global.debugging === false) {
    global.require('freeport')(function(err,port) {
      //process.debugPort = port;
      //C: starting debugger agent if not automatically done by node
      process.kill(process.pid, 'SIGUSR1');
    });
  }
  global.debugging = true;
  global.development = true;
}

//C: detecting whether Node is running as testing environment
global.testing = false;
if (process.env.NODE_ENV === 'testing') {
  global.testing = true;
  global.debugging = true;
  global.development = true;
}

setImmediate(function(){
  //C: loading ljve application server executable module
  global.require.main._compile('\n'+require('fs').readFileSync(global.main.path.core + '/core/main.server.js'));
});

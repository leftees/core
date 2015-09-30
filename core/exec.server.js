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

// loading native modules for main phase
var child_process = require('child_process');
var cluster = require('cluster');
var fs = require('fs');
var path = require('path');

// adding both core and root node_modules folders to require
require('app-module-path').addPath(path.join(process.cwd(),'node_modules'));
require('app-module-path').addPath(path.join(path.dirname(require.main.filename),'node_modules'));

// creating temporary main namespace for modular CLI command support
global.main = {};

// storing root paths
global.main.path = {};
global.main.path.root = process.cwd();
global.main.path.core = path.dirname(require.main.filename);

// detecting whether Node is running as development environment
global.development = false;
if (process.env.NODE_ENV === 'development') {
  global.development = true;
}

// setting the debugger port
if ([ 'v0.10.', 'v4.'].some(function(version){ return (process.version.indexOf(version) === 0); }) === true) {
  // fixing cluster node debug ports
  if (cluster.isWorker === true) {
    process.debugPort += cluster.worker.id;
  }
}
// detecting whether Node is running as debugging environment
global.debugging = false;
process.debugActive = false;
// detecting whether debugger is running through node args
process.execArgv.forEach(function(arg) {
  if (arg === '--debug' || arg.startsWith('--debug=') === true || arg === '--debug-brk' || arg.startsWith('--debug-brk=') === true){
    process.debugActive = true;
    global.debugging = true;
    global.development = true;
  }
});
// detecting whether debugger should run because of environment
if (process.env.NODE_ENV === 'debugging') {
  if (global.debugging === false) {
    process.debugActive = false;
  }
  global.debugging = true;
  global.development = true;
}

// detecting whether Node is running as testing environment
global.testing = false;
if (process.env.NODE_ENV === 'testing') {
  global.testing = true;
  global.debugging = true;
  global.development = true;
}

if (process.platform === 'win32') {
  try {
    process.name = child_process.execSync('powershell.exe -Command "Get-WmiObject Win32_PerfFormattedData_PerfProc_Process | where-object{ $_.IDProcess -eq ' +
      process.pid + ' } | Format-Table Name,IDProcess -AutoSize -HideTableHeaders"').toString().replace(/\r\n/gi, '').match(/^.*?(?=\s)/)[0];
  } catch(error) {
    throw new Error('unable to get process name: please make sure powershell.exe and WMI stack is installed');
  }
}

// loading ljve application server executable module
global.require.main._compile('\n'+require('fs').readFileSync(global.main.path.core + '/core/main.server.js'), {encoding: 'utf-8'});
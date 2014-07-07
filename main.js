'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */

//C: detecting node debugger enabled (through node arguments)
global.debugging = false;
process.execArgv.forEach(function(arg) {
  if (arg.indexOf('--debug') == 0 || arg.indexOf('debug') == 0){
    global.debugging = true;
  }
});

//C: detecting whether Node is running as development environment
global.development = true;
if (process.env.NODE_ENV == 'production') {
  global.development = false;
}

//C: exporting global require against server root (needed later)
global.require = require;

//C: detecting whether spawned node debugger launch is needed
if (global.development == true && global.debugging == false){
  
  //C: getting current node process execArgv extended with debug flag
  var execArgv = ['--debug'].concat(process.execArgv);
  
  //C: enabling ECMAScript 6 by default
  if (execArgv.indexOf('--harmony') == -1){
    execArgv.push('--harmony');
  }
  
  //C: getting current script location from process.argv
  execArgv.push(process.argv[1]);
  
  //C: getting current node app arguments array from current process
  var appArgv = [].concat(process.argv);
  appArgv.shift();
  appArgv.shift();
  
  //C: merging extended node process and node app arguments
  execArgv = execArgv.concat(appArgv);
  
  //C: spawning a nested debug-enabled node process
  var node_debug = require('child_process').spawn(process.argv[0],execArgv);
  
  //C: attaching on child stderr data event to enable console proxy
  node_debug.stdout.on('data', function (data) {
    //C: logging string but no last \n char (cli colors preserved)
    console.log(data.toString('utf8',0,data.length-1));
  });

  //C: attaching on child stderr data event to enable console proxy
  node_debug.stderr.on('data', function (data) {
  //C: logging string but no last \n char (cli colors preserved)
    console.log(data.toString('utf8',0,data.length-1));
  });

  //C: attaching on child close event to exit main
  node_debug.on('close', function (code,signal) {
    process.exit(code);
  });
  
  //C: attaching on main signals to kill child
  ['SIGINT'].forEach(function (e) {
    process.on(e, function () {
      node_debug.kill();
    });
  });

} else {
  
  //C: loading ljve application server executable module
  try {
    //global.require('./core/main.server.js');
  } catch (err) {
    console.error(err.message);
  }
}

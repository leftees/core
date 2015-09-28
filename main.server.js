#!/usr/bin/env node
'use strict';
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

var child_process = require('child_process');
var path = require('path');

if (process.env.NODE_WRAPPER_MAIN !== 'false' && process.env.NODE_LOW_MEMORY !== 'true') {
  var parallel_node_path;
  if (process.env.NODE_PARALLEL_RUNTIME != null && process.env.NODE_PARALLEL_RUNTIME !== '' && process.env.NODE_PARALLEL_RUNTIME !== 'system') {
    parallel_node_path = path.join(__dirname, 'bin', 'node', process.platform, process.arch);
    //T: install if no parallel environment is available
    var parallel_node_version = process.env.NODE_PARALLEL_RUNTIME;
    parallel_node_path = path.join(parallel_node_path, parallel_node_version, 'bin');
  } else {
    parallel_node_path = path.dirname(process.execPath);
  }

  var env = Object.create(process.env);
  env.PATH = parallel_node_path + ':' + env.PATH;
  delete env.NODE_PARALLEL_RUNTIME;
  env.NODE_WRAPPER_MAIN = 'false';
  var args = Array.prototype.slice.call(process.argv);
  args.shift();
  var execArgv = Array.prototype.slice.call(process.execArgv);

  // workaround for missing SIG_USR1 signal and late debugger enabling
  if (process.platform === 'win32'){
    args.forEach(function(arg,index){
      if (arg === 'debug' || arg === 'debug.cluster') {
        process.env.NODE_ENV = 'debugging';
      }
    });
  }

  var debugArgv = null;
  execArgv = execArgv.map(function(arg) {
    if (arg === '--debug' || arg.indexOf('--debug=') === 0 || arg === '--debug-brk' || arg.indexOf('--debug-brk=') === 0){
      debugArgv = arg;
      return ('--debug='+(process.debugPort+1));
    }
    return arg;
  });
  if (debugArgv == null && process.env.NODE_ENV === 'debugging'){
    execArgv.unshift('--debug');
  }

  var parallel_process = child_process.spawn(path.join(parallel_node_path, 'node'), execArgv.concat(args), {
    'cwd': process.cwd(),
    'env': env
  });
  args = null;
  execArgv = null;
  parallel_process.stderr.pipe(process.stderr);
  parallel_process.stdout.pipe(process.stdout);
  ['exit', 'SIGTERM', 'SIGINT'].forEach(function(e) {
    process.on(e, function() {
      parallel_process.kill();
    });
  });
  child_process = null;
  path = null;
} else {
  //C: storing the current time as process start datetime
  process.startTime = Date.now();

  //C: exporting global require against server root (needed later)
  global.require = require;

  //C: backporting partial ECMAScript 6 features (through injection of hidden javascript file)
  global.require('./core/polyfill.server.js');

  //C: starting executable stub (through injection of hidden javascript file)
  global.require.main._compile('\n'+require('fs').readFileSync(__dirname + '/core/exec.server.js', {encoding: 'utf-8'}));

  //C: invalidating main file from require cache
  delete global.require.cache[global.require.main.filename];

  //C: replacing main javascript file to automatically open custom file to debugger
  global.require.main.filename = __dirname + '/main.readme.js';
}
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

//C: creating temporary main namespace for modular CLI command support
global.main = {};

//C: storing root paths
global.main.path = {};
global.main.path.app = process.cwd();
global.main.path.core = require('path').dirname(require.main.filename);

//C: detecting node debugger enabled (through node arguments)
global.debugging = false;
process.execArgv.forEach(function(arg) {
  if (arg.indexOf('--debug') === 0 || arg.indexOf('debug') === 0){
    global.debugging = true;
  }
});

//C: detecting whether Node is running as development environment
global.development = false;
if (process.env.NODE_ENV === 'development') {
  global.development = true;
}

//C: detecting whether Node is running as testing environment
global.testing = false;
if (process.env.NODE_ENV === 'test') {
  global.testing = true;
  global.development = true;
}

//C: detecting whether spawned node debugger launch is needed
if (global.development === true && global.debugging === false){

  //C: getting current node process execArgv extended with debug flag
  var execArgv = ['--debug'].concat(process.execArgv);

  //C: enabling ECMAScript 6 by default
  if (execArgv.indexOf('--harmony') === -1){
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

  //C: attaching child stdout to process stdoud
  node_debug.stdout.pipe(process.stdout);

  //C: attaching child stderr to process stderr
  node_debug.stderr.pipe(process.stderr);

  //C: attaching on child close event to exit main
  node_debug.on('close', function (code,signal) {
    process.exit(code);
  });

  //C: attaching on main process events to propagate them to child
  ['exit','uncaughtException'].forEach(function (e) {
    process.on(e, function () {
      node_debug.kill();
    });
  });

  //C: attaching on main signals to propagate them to child (not everyone useful, but should be a comprehensive list)
  ['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGABRT','SIGFPE',/*'SIGKILL',*/'SIGSEGV','SIGPIPE','SIGALRM','SIGTERM',
    'SIGUSR1','SIGUSR2','SIGCHLD','SIGCONT',/*'SIGSTOP',*/'SIGTSTP','SIGTTIN','SIGTTOU','SIGBUS','SIGPOLL','SIGPROF',
    'SIGSYS','SIGTRAP','SIGURG','SIGVTALRM','SIGXCPU','SIGXFSZ','SIGIOT','SIGEMT','SIGSTKFLT','SIGIO','SIGCLD',
    'SIGPWR','SIGINFO','SIGLOST','SIGWINCH','SIGUNUSED'].forEach(function (e) {
      process.on(e, function () {
        node_debug.kill(e);
      });
    });

} else {

  //C: loading ljve application server executable module
  try {
    global.require.main._compile('\n'+require('fs').readFileSync(global.main.path.core + '/core/main.server.js', { encoding: 'utf-8' }),'app:///core/main.server.js');
  } catch (err) {
    console.error(err.message);
  }

}

//C: attaching on main process fail events
['uncaughtException'].forEach(function(e) {
  process.on(e, function(err) {
    console.error(err);
    //T: implement graceful shutdown
  });
});

//C: attaching on main process kill events to force exit
['SIGTERM', 'SIGINT'].forEach(function(e) {
  process.on(e, function() {
    //T: implement graceful shutdown
    process.exit();
  });
});
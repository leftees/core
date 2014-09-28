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
if (process.env.NODE_ENV === 'debugging') {
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

//C: getting current node process execArgv
var execArgv = process.execArgv;

//C: detecting nested process (assuming --harmony is only passed when internally spawning)
if (execArgv.indexOf('--harmony') === -1){
  //C: detecting node debugger enabled (through node arguments)
  var wrong_debug = false;
  process.execArgv.forEach(function(arg) {
    if (arg.indexOf('--debug') === 0 || arg.indexOf('debug') === 0){
      wrong_debug = true;
    }
  });
  if (wrong_debug === true){
    console.error('debugging must be enabled through NODE_ENV=debugging rather than using node args');
    return;
  }

  //C: enabling ECMAScript 6 by default
  execArgv.push('--harmony');

  //C: enabling debugger if needed
  if (global.debugging === true) {
    execArgv.unshift('--debug');
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
  //node_debug.stdout.on('data',function(data){
  //  console.log(data.toString());
  //});

  //C: attaching child stderr to process stderr
  node_debug.stderr.pipe(process.stderr);
  //node_debug.stderr.on('data',function(data){
  //  console.error(data.toString());
  //});

  //C: attaching on child close event to exit main
  node_debug.on('close', function (code,signal) {
    //T: implement watchdog with restart attempts when exit code is > 0
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

  //C: detecting whether debugger is running through node args
  process.execArgv.forEach(function(arg) {
    if (arg.indexOf('--debug') === 0 || arg.indexOf('debug') === 0){
      global.debugging = true;
    }
  });

  //C: loading ljve application server executable module
  try {
    global.require.main._compile('\n'+require('fs').readFileSync(global.main.path.core + '/core/main.server.js', { encoding: 'utf-8' }),'app:///core/main.server.js');
  } catch (err) {
    throw err;
  }
}

//C: attaching on main process fail events
['uncaughtException'].forEach(function(e) {
  process.on(e, function(err) {
    console.error('uncaught exception: %s', err.stack || err.message);
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
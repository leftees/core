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

// defining run CLI command
global.main.commands['run.cluster'] = function(base){

  var args = require('yargs').argv;
  var cluster = require('cluster');
  var fs = require('fs');
  var path = require('path');

  if (global.debugging === true && process.debugActive === false){
    global.main.commands['debug.cluster']();
    return;
  }

  // processing arguments
  var root = base || args._[1] || args.root;
  // checking whether root folder is valid
  if (root != null && typeof root === 'string'){
    // normalizing root (removing last separators)
    root = root.replace(/\/*$|\\*$/,'');
    if (root[0] !== path.sep) {
      root = path.resolve(process.cwd(),root);
    }
    if (fs.existsSync(root) === true){
      // storing new root folder
      global.main.path.root = path.normalize(root);
    } else {
      return console.error('specified root folder %s does not exist, please use absolute path', root);
    }
  }

  if (cluster.isMaster === true) {
    // printing logo
    global.main.commands.logo();
    // printing version
    global.main.commands.version.print();
  }

  // attaching on main process fail events
  ['uncaughtException'].forEach(function(e) {
    process.on(e, function(error) {
      console.error('uncaught exception: %s', error.stack || error.message, error);
      //TODO: implement graceful shutdown
      //process.exit();
    });
  });

  // attaching on main process kill events to force exit
  ['SIGTERM', 'SIGINT'].forEach(function(e) {
    process.on(e, function() {
      //TODO: implement graceful shutdown
      process.exit();
    });
  });

  // loading native modules
  global.require('./core/native.server.js');

  // defining the scope for metascript preprocessor
  native.compile.scope.CLUSTER = true;
  native.cluster = require('cluster');

  // initializing native compile
  native.compile.init();

  // loading ljve application server
  var bootstrap_dist_path = path.join(global.main.path.core,'dist/cluster/boot/bootstrap.server.js.boot');
  if (process.env.BUILD == null && fs.existsSync(bootstrap_dist_path) === true) {
    require(bootstrap_dist_path);
  } else {
    global.native.compile('/core/cluster/bootstrap.server.js', global.main.path.core, 'boot', true, true);
  }

  bootstrap.post(true).catch(function(error){
    console.error('uncaught exception: %s', error.stack || error.message, error);
  });
};

// defining run.cluster CLI command manual
global.main.commands['run.cluster'].man = function() {
  console.log('\
  run.cluster [root]\n\
  Start application cluster and server.\n\
  \n\
    --root=/var/www\n\
    Define the root path where the cluster will find application folder and files.\n\
    If this argument is missing, the current working directory will be used.\
  ');
};

global.main.commands['develop.cluster'] = function(){
  process.env.NODE_ENV = 'development';
  global.development = true;
  global.main.commands['run.cluster']();
};

// defining develop.cluster CLI command manual
global.main.commands['develop.cluster'].man = function() {
  console.log('\
  develop.cluster [root]\n\
  Start application cluster and server in development mode (equivalent to NODE_ENV=development).\n\
  \n\
    --root=/var/www\n\
    Define the root path where the cluster will find application folder and files.\n\
    If this argument is missing, the current working directory will be used.\
  ');
};

global.main.commands['debug.cluster'] = function(){
  process.env.NODE_ENV = 'debugging';
  global.development = true;
  global.debugging = true;

  if (global.debugging === true && process.debugActive === false){
    // starting debugger agent if not automatically done by node (forked nodes will inherit non-breaking debug)
    require('child_process').exec(process.execPath + ' ' + global.main.path.core + '/core/resume.server.js' + ' ' + process.debugPort,function(error){
      global.main.commands['run.cluster']();
    });
    process.debugActive = true;
    if (process.platform !== 'win32') {
      process.kill(process.pid, 'SIGUSR1');
    } else {
      console.warn('TODO: implement programmatic SIGUSR1 replacement for debugger activation in Windows platform');
    }
  } else {
    global.main.commands['run.cluster']();
  }
};

// defining debug.cluster CLI command manual
global.main.commands['debug.cluster'].man = function() {
  console.log('\
  debug.cluster [root]\n\
  Start application cluster and server in debugging mode (equivalent to NODE_ENV=debugging).\n\
  \n\
    --root=/var/www\n\
    Define the root path where the cluster will find application folder and files.\n\
    If this argument is missing, the current working directory will be used.\
  ');
};
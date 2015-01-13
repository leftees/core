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

//N: Provides development tools classes and objects.
platform.development = platform.development || {};
platform.development.tools = platform.development.tools || {};

//F: Starts the specified tool.
//A: name: Specifies the name to be started.
//A: [port]: Specifies the port argument to be passed to the tool (varies by tool).
//A: [internal_port]: Specifies the internal port argument to be passed to the tool (varies by tool).
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools._start = function(name,port,internal_port){
  if (platform.development.tools._is_running(name) === false) {
    //T: support custom ports (both for frontend)
    if (platform.development.tools[name].hasOwnProperty('_agent') === true) {
      //T: support spawned process close detection
      //C: activating agent for node-webkit-agent based tools
      platform.development.tools[name]._agent = new (global.require(platform.runtime.path.core + platform.development.tools[name]._agent_path))();
      platform.development.tools[name]._agent.start(port, '0.0.0.0', internal_port, false);
    }
    //C: executing tool separate process(es)
    if (Array.isArray(platform.development.tools[name]._process_path) === true){
      platform.development.tools[name]._process = [];
      platform.development.tools[name]._process_path.forEach(function(process_path){
        platform.development.tools[name]._process.push(require('child_process').spawn('node', [platform.runtime.path.core + process_path, port, internal_port]));
      });
    } else {
      platform.development.tools[name]._process = require('child_process').spawn('node', [platform.runtime.path.core + platform.development.tools[name]._process_path, port,internal_port]);
    }
  } else {
    throw new Exception('%s tool is already running',name);
  }
};

//F: Checks whether the tool is running.
//A: name: Specifies the name to be checked.
//R: Returns true if the specified  tool is running.
platform.development.tools._is_running = function(name){
  return (platform.development.tools[name]._process != null && (platform.development.tools[name].hasOwnProperty('_agent') === false || (platform.development.tools[name].hasOwnProperty('_agent') === true && platform.development.tools[name]._agent != null)));
};

//F: Stops the specified tool.
//A: name: Specifies the name to be stopped.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools._stop = function(name){
  if (platform.development.tools._is_running(name) === true) {
    if (platform.development.tools[name].hasOwnProperty('_agent') === true) {
      platform.development.tools[name]._agent.stop();
      platform.development.tools[name]._agent = undefined;
    }
    //C: killing separate process(es)
    if (Array.isArray(platform.development.tools[name]._process_path) === true){
      platform.development.tools[name]._process.forEach(function(process){
        process.kill();
      });
      platform.development.tools[name]._process = undefined;
    } else {
      platform.development.tools[name]._process.kill();
      platform.development.tools[name]._process = undefined;
    }
  } else {
    throw new Exception('%s tool is not running', name);
  }
};

//O: Provides support for node-inspector.
platform.development.tools.inspector = {};

//V: Checks whether the tool is running.
platform.development.tools.inspector.running = false;

//V: Contains forked child process object when running.
platform.development.tools.inspector._process = undefined;

//V: Define separated process path for inspector.
platform.development.tools.inspector._process_path = '/node_modules/node-inspector/bin/inspector.js';

//F: Starts the Inspector tool.
//A: [port]: Specifies the port argument to be passed to the tool (varies by tool).
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.inspector.start = function(port){
  var name = 'inspector';
  if (platform.development.tools._is_running(name) === false) {
    //C: executing tool separate process(es)
    platform.development.tools[name]._process = require('child_process').spawn('node', [
      platform.runtime.path.core + platform.development.tools[name]._process_path,
      '--web-host',
      '0.0.0.0',
      '--web-port',
      port,
      '--debug-port',
      process.debugPort,
      '--no-save-live-edit',
      '--no-preload'
    ]);
  } else {
    throw new Exception('%s tool is already running',name);
  }
};

//F: Stops the Inspector tool.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools.inspector.stop = function(){
  var name = 'inspector';
  if (platform.development.tools._is_running(name) === true) {
    //C: killing separate process(es)
    platform.development.tools[name]._process.kill();
    platform.development.tools[name]._process = undefined;
  } else {
    throw new Exception('%s tool is not running', name);
  }
};

//O: Provides support for node-webkit-agent console frontend.
platform.development.tools.console = {};

//V: Checks whether the tool is running.
platform.development.tools.console.running = false;

//V: Contains forked child process object when running.
platform.development.tools.console._process = undefined;
//V: Contains forked child process object for agent when running.
platform.development.tools.console._agent = undefined;

//V: Define separated process path for console.
platform.development.tools.console._process_path = '/node_modules/node-console/server.js';

//V: Define agent path for inspector.
platform.development.tools.console._agent_path = '/node_modules/node-console/agent.js';

//F: Starts the specified tool.
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.console.start = platform.development.tools._start.bind(null,'console',9999,3333);

//F: Stops the specified tool.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools.console.stop = platform.development.tools._stop.bind(null,'console');

//O: Provides support for brackets ide.
platform.development.tools.ide = {};

//V: Checks whether the tool is running.
platform.development.tools.ide.running = false;

//V: Contains forked child process object when running (as array).
platform.development.tools.ide._process = undefined;

//V: Define separated process path for brackets.io IDE.
platform.development.tools.ide._process_path = '/node_modules/node-ide/lib/run.js';

//F: Starts the IDE tool.
//A: [port]: Specifies the port argument to be passed to the tool (varies by tool).
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.ide.start = function(port){
  var name = 'ide';
  if (platform.development.tools._is_running(name) === false) {
    //C: checking and creating brackets data folder (temporary, it should be replace with in-browser-filesystem)
    var data_fs = platform.io.store.getByName('app');
    if (data_fs.exist('/data/ide/') === false){
      data_fs.create('/data/ide/');
    }
    //C: executing tool separate process(es)
    platform.development.tools[name]._process = require('child_process').spawn('node', [
      platform.runtime.path.core + platform.development.tools[name]._process_path,
      '--port',
      port,
      '--proj-dir',
      platform.runtime.path.app,
      '--supp-dir',
      native.path.join(data_fs.base,'/data/ide')
    ]);
  } else {
    throw new Exception('%s tool is already running',name);
  }
};

//F: Stops the IDE tool.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools.ide.stop = function(){
  var name = 'ide';
  if (platform.development.tools._is_running(name) === true) {
    //C: killing separate process(es)
    platform.development.tools[name]._process.kill();
    platform.development.tools[name]._process = undefined;
  } else {
    throw new Exception('%s tool is not running', name);
  }
};

//C: defining running property for each supported tool.
['inspector' ,'console', 'ide'].forEach(function(name){
  Object.defineProperty(platform.development.tools[name],'running',{ get: platform.development.tools._is_running.bind(null,name), set: function(){}});
});

//C: attaching exit events to kill node-inspector
['exit','SIGINT','SIGTERM'].forEach(function (e) {
  process.on(e, function () {
    try {
      //C: stopping inspector before exit
      if (platform.development.tools.inspector.running === true) {
        platform.development.tools.inspector.stop();
      }
    } catch(err){}

    try{
      //C: stopping console before exit
      if (platform.development.tools.console.running === true) {
        platform.development.tools.console.stop();
      }
    } catch(err){}

    try{
      //C: stopping ide before exit
      if (platform.development.tools.ide.running === true) {
        platform.development.tools.ide.stop();
      }
    } catch(err){}
  });
});

//C: starting node-inspector (only if debug is enabled)
if (platform.runtime.debugging === true) {
  //T: add autostart support in configuration
  platform.development.tools.inspector.start(9091);
}


//C: starting development tools (only if development is enabled - NODE_ENV=development)
if (platform.runtime.development === true) {
  //T: add autostart support in configuration
  platform.development.tools.console.start();
  platform.development.tools.ide.start(9092);
}
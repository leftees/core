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

//N: Provides development tools classes and objects.
platform.development = platform.development || {};
platform.development.tools = platform.development.tools || {};

//F: Starts the specified tool.
//A: name: Specifies the name to be started.
//A: [port]: Specifies the port argument to be passed to the tool (varies by tool).
//A: [internal_port]: Specifies the internal port argument to be passed to the tool (varies by tool).
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.__start__ = function(name,port,internal_port){
  if (platform.development.tools.__is_running__(name) === false) {
    //T: support custom ports (both for frontend)
    if (platform.development.tools[name].hasOwnProperty('__agent__') === true) {
      //T: support spawned process close detection
      //C: activating node-webkit-agent for console
      platform.development.tools[name].__agent__ = new (global.require(platform.runtime.path.core + '/node_modules/webkit-devtools-agent/index'))();
      platform.development.tools[name].__agent__.start(port, '0.0.0.0', internal_port, false);
    }
    //C: executing console frontend in a separate process
    platform.development.tools[name].__process__ = require('child_process').spawn('node', [platform.runtime.path.core + '/node_modules/webkit-devtools-agent-frontend-' + name + '/main.js', port]);
  } else {
    throw new Exception('%s tool is already running',name);
  }
};

//F: Checks whether the tool is running.
//A: name: Specifies the name to be checked.
//R: Returns true if the specified  tool is running.
platform.development.tools.__is_running__ = function(name){
  return (platform.development.tools[name].__process__ != null && (platform.development.tools[name].hasOwnProperty('__agent__') === false || (platform.development.tools[name].hasOwnProperty('__agent__') === true && platform.development.tools[name].__agent__ != null)));
};

//F: Stops the specified tool.
//A: name: Specifies the name to be stopped.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools.__stop__ = function(name){
  if (platform.development.tools.__is_running__(name) === true) {
    if (platform.development.tools[name].hasOwnProperty('__agent__') === true) {
      platform.development.tools[name].__agent__.stop();
      platform.development.tools[name].__agent__ = undefined;
    }
    platform.development.tools[name].__process__.kill();
    platform.development.tools[name].__process__ = undefined;
  } else {
    throw new Exception('%s tool is not running', name);
  }
};

//O: Provides support for node-inspector.
platform.development.tools.inspector = {};

//V: Checks whether the tool is running.
platform.development.tools.inspector.running = false;

platform.development.tools.inspector.__process__ = undefined;

//F: Starts the specified tool.
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.inspector.start = platform.development.tools.__start__.bind(null,'inspector');

//F: Stops the specified tool.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools.inspector.stop = platform.development.tools.__stop__.bind(null,'inspector');

//O: Provides support for node-webkit-agent console frontend.
platform.development.tools.console = {};

//V: Checks whether the tool is running.
platform.development.tools.console.running = false;

platform.development.tools.console.__process__ = undefined;
platform.development.tools.console.__agent__ = undefined;

//F: Starts the specified tool.
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.console.start = platform.development.tools.__start__.bind(null,'console',9999,3333);

//F: Stops the specified tool.
//R: None.
//H: Throws exception if tool is not running.
platform.development.tools.console.stop = platform.development.tools.__stop__.bind(null,'console');

//O: Provides support for node-webkit-agent profiler frontend.
platform.development.tools.profiler = {};

//V: Checks whether the tool is running.
platform.development.tools.profiler.running = false;

platform.development.tools.profiler.__process__ = undefined;
platform.development.tools.profiler.__agent__ = undefined;

//F: Starts the specified tool.
//R: None.
//H: Throws exception if tool is already running.
platform.development.tools.profiler.start = platform.development.tools.__start__.bind(null,'profiler',9998,3332);

//F: Stops the specified tool.
//R: None.
//H: Throws exception if tool is not running,
platform.development.tools.profiler.stop = platform.development.tools.__stop__.bind(null,'profiler');

//C: defining running property for each supported tool.
['inspector','console','profiler'].forEach(function(name){
  Object.defineProperty(platform.development.tools[name],'running',{ get: platform.development.tools.__is_running__.bind(null,name), set: function(){}});
});

//C: attaching exit events to kill node-inspector
['exit','SIGINT','SIGTERM','uncaughtException'].forEach(function (e) {
  process.on(e, function () {
    try {
      platform.development.tools.inspector.stop();
    } finally {
    }
    try {
      platform.development.tools.console.stop();
    } finally {
    }
    try {
      platform.development.tools.profiler.stop();
    } finally {
    }
  });
});

//C: starting node-inspector (only if debug is enabled)
if (platform.runtime.debugging === true) {
  //T: add autostart support in configuration
  platform.development.tools.inspector.start();
}

//C: starting development tools (only if development is enabled - NODE_ENV=development)
if (platform.runtime.development === true) {
  //T: add autostart support in configuration
  platform.development.tools.console.start();
  platform.development.tools.profiler.start();
}

//T: add autostart support in configuration
//O: Provides support for memory monitoring and management (based on memwatch).
platform.development.tools.memory = {};
platform.development.tools.memory.__memwatch__ = require('memwatch');
platform.development.tools.memory.__heapdiff__ = null;

//F: Starts memory heap diff analysis.
platform.development.tools.memory.start = function(){
  platform.development.tools.memory.__heapdiff__ = new platform.development.tools.memory.__memwatch__.HeapDiff();
};

//F: Stops memory heap and returns diff analysis.
//R: Returns head diff object from memwatch module.
platform.development.tools.memory.stop = function(){
  var heapdiff = platform.development.tools.memory.__heapdiff__;
  platform.development.tools.memory.__heapdiff__ = null;
  return heapdiff.end();
};

//F: Demands a V8 runtime garbage collection.
platform.development.tools.memory.collect = function(){
  platform.development.tools.memory.__memwatch__.gc();
};

//O: Stores memory data for trend analysis.
platform.development.tools.memory.__previous__ = {};
platform.development.tools.memory.__previous__.heap = 0;
platform.development.tools.memory.__previous__.rss = 0;

var humanSize = function (bytes) {
  var labels = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + labels[i];
};

//F: Prints V8 runtime memory usage.
platform.development.tools.memory.log = function(change){
  //C: extracting memory usage data
  var memory = process.memoryUsage();

  //C: calculating memory usage trend
  var trend_heap = Math.floor((memory.heapTotal-platform.development.tools.memory.__previous__.heap)/platform.development.tools.memory.__previous__.heap*10000)/100;
  var trend_rss = Math.floor((memory.rss-platform.development.tools.memory.__previous__.rss)/platform.development.tools.memory.__previous__.rss*10000)/100;
  var trend_heap_label;
  if (trend_heap === Infinity) {
    trend_heap_label = 'n/a';
  } else {
    trend_heap_label = ((trend_heap > 0) ? '+' + trend_heap : trend_heap) + '%';
  }
  var trend_rss_label;
  if (trend_rss === Infinity) {
    trend_rss_label = 'n/a';
  } else {
    trend_rss_label = ((trend_rss > 0) ? '+' + trend_rss : trend_rss) + '%';
  }

  //C: storing memory data for further trend analysis
  platform.development.tools.memory.__previous__.heap = memory.heapTotal;
  platform.development.tools.memory.__previous__.rss = memory.rss;

  if (change === true || trend_heap !== 0 || trend_rss !== 0) {
    console.debug('memory status: %s heap (%s), %s ram (%s)', humanSize(memory.heapTotal), trend_heap_label, humanSize(memory.rss), trend_rss_label);
  }
};

//C: starting memory watcher (only if debug is enabled)
//T: add platform event for memory leak/stats
//C: attaching to memwatch leak event
platform.development.tools.memory.__memwatch__.on('leak', function (info) {
  console.warn('possible memory leak detected: %s', info.reason);
});
//C: attaching to memwatch stats event
platform.development.tools.memory.__memwatch__.on('stats', function (stats) {
  if (platform.configuration.server.debugging.memory === true) {
    platform.development.tools.memory.log();
  }
});

if (platform.configuration.server.memory.gc.force === true) {
  platform.development.tools.memory.__interval__ = setInterval(platform.development.tools.memory.collect, platform.configuration.server.memory.gc.interval);
}
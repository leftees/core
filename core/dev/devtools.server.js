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

platform.development.tools.__start__ = function(name,port,internal_port){
  if (platform.development.tools[name].__process__ === undefined && (platform.development.tools[name].hasOwnProperty('__agent__') === false || (platform.development.tools[name].hasOwnProperty('__agent__') === true && platform.development.tools[name].__agent__ === undefined))) {
    //T: support custom ports (both for frontend)
    if (platform.development.tools[name].hasOwnProperty('__agent__') === true) {
      //C: activating node-webkit-agent for console
      platform.development.tools[name].__agent__ = new (global.require(platform.runtime.path.core + '/external/devtools/agent/index'))();
      platform.development.tools[name].__agent__.start(port, '0.0.0.0', internal_port, false);
    }
    //C: executing console frontend in a separate process
    platform.development.tools[name].__process__ = require('child_process').spawn('node', [platform.runtime.path.core + '/external/devtools/' + name + '/main.js', port]);
  } else {
    throw new Exception('%s tool is already running',name);
  }
};

platform.development.tools.__stop__ = function(name){
  if (platform.development.tools[name].__process__ !== undefined && (platform.development.tools[name].hasOwnProperty('__agent__') === false || (platform.development.tools[name].hasOwnProperty('__agent__') === true && platform.development.tools[name].__agent__ !== undefined))) {
    if (platform.development.tools[name].hasOwnProperty('__agent__') === true) {
      platform.development.tools[name].__agent__.stop();
      platform.development.tools[name].__agent__ = undefined;
    }
    platform.development.tools[name].__process__.kill();
    platform.development.tools[name].__process__ = undefined;
  } else {
    throw new Exception('profiler tool is not running');
  }
};

platform.development.tools.inspector = {};
platform.development.tools.inspector.__process__ = undefined;
platform.development.tools.inspector.start = platform.development.tools.__start__.bind(null,'inspector');
platform.development.tools.inspector.stop = platform.development.tools.__stop__.bind(null,'inspector');

platform.development.tools.console = {};
platform.development.tools.console.__process__ = undefined;
platform.development.tools.console.__agent__ = undefined;
platform.development.tools.console.start = platform.development.tools.__start__.bind(null,'console',9999,3333);
platform.development.tools.console.stop = platform.development.tools.__stop__.bind(null,'console');

platform.development.tools.profiler = {};
platform.development.tools.profiler.__process__ = undefined;
platform.development.tools.profiler.__agent__ = undefined;
platform.development.tools.profiler.start = platform.development.tools.__start__.bind(null,'profiler',9998,3332);
platform.development.tools.profiler.stop = platform.development.tools.__stop__.bind(null,'profiler');

//C: attaching exit events to kill node-inspector
['exit','SIGINT','SIGTERM'].forEach(function (e) {
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
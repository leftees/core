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


platform.development.tools.inspector = {};
platform.development.tools.inspector.__process__ = undefined;
platform.development.tools.inspector.start = function () {
  if (platform.development.tools.inspector.__process__ === undefined) {
    //T: support custom ports (both for debugger and frontend)
    //C: executing node-inspector frontend in a separate process
    platform.development.tools.inspector.__process__ = require('child_process').spawn('node', [platform.runtime.path.core + '/external/devtools/inspector/main.js']);
  } else {
    throw new Exception('inspector tool is already running');
  }
};
platform.development.tools.inspector.stop = function () {
  if (platform.development.tools.inspector.__process__ !== undefined) {
    platform.development.tools.inspector.__process__.kill();
    platform.development.tools.inspector.__process__ = undefined;
  } else {
    throw new Exception('inspector tool is not running');
  }
};

platform.development.tools.console = {};
platform.development.tools.console.__process__ = undefined;
platform.development.tools.console.__agent__ = undefined;
platform.development.tools.console.start = function () {
  if (platform.development.tools.console.__process__ === undefined && platform.development.tools.console.__agent__ === undefined) {
    //T: support custom ports (both for console and frontend)
    //C: activating node-webkit-agent for console
    platform.development.tools.console.__agent__ = new (global.require(platform.runtime.path.core + '/external/devtools/agent/index'))();
    platform.development.tools.console.__agent__.start(9999, '0.0.0.0', 3333, false);
    //C: executing console frontend in a separate process
    platform.development.tools.console.__process__ = require('child_process').spawn('node', [platform.runtime.path.core + '/external/devtools/console/main.js', 9999]);
  } else {
    throw new Exception('console tool is already running');
  }
};
platform.development.tools.console.stop = function () {
  if (platform.development.tools.console.__process__ !== undefined && platform.development.tools.console.__agent__ !== undefined) {
    platform.development.tools.console.__agent__.stop();
    platform.development.tools.console.__process__.kill();
    platform.development.tools.console.__process__ = undefined;
    platform.development.tools.console.__agent__ = undefined;
  } else {
    throw new Exception('console tool is not running');
  }
};

platform.development.tools.profiler = {};
platform.development.tools.profiler.__process__ = undefined;
platform.development.tools.profiler.__agent__ = undefined;
platform.development.tools.profiler.start = function () {
  if (platform.development.tools.profiler.__process__ === undefined && platform.development.tools.profiler.__agent__ === undefined) {
    //T: support custom ports (both for profiler and frontend)
    //C: activating node-webkit-agent for profiler
    platform.development.tools.profiler.__agent__ = new (global.require(platform.runtime.path.core + '/external/devtools/agent/index'))();
    platform.development.tools.profiler.__agent__.start(9998, '0.0.0.0', 3332, false);
    //C: executing profiler frontend in a separate process
    platform.development.tools.profiler.__process__ = require('child_process').spawn('node', [platform.runtime.path.core + '/external/devtools/profiler/main.js', 9998]);
  } else {
    throw new Exception('profiler tool is already running');
  }
};
platform.development.tools.profiler.stop = function () {
  if (platform.development.tools.profiler.__process__ !== undefined && platform.development.tools.profiler.__agent__ !== undefined) {
    platform.development.tools.profiler.__agent__.stop();
    platform.development.tools.profiler.__process__.kill();
    platform.development.tools.profiler.__process__ = undefined;
    platform.development.tools.profiler.__agent__ = undefined;
  } else {
    throw new Exception('profiler tool is not running');
  }
};

//C: attaching exit events to kill node-inspector
['exit','SIGINT','SIGTERM'].forEach(function (e) {
  process.on(e, function () {
    try {
      if(platform.development.tools.inspector !== undefined)
      {
        platform.development.tools.inspector.stop();
      }
    } finally {
    }
    try {
      if(platform.development.tools.console !== undefined)
      {
        platform.development.tools.console.stop();
      }
    } finally {
    }
    try {
      if(platform.development.tools.profiler !== undefined)
      {
        platform.development.tools.profiler.stop();
      }
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
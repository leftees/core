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

//C: loading node-inspector (only if debug is enabled)
if (global.debugging === true) {
  //T: support custom ports (both for debugger and frontend)
  //C: executing node-inspector frontend in a separate process
  var inspector = require('child_process').spawn('node', [global.main.path.core + '/external/devtools/inspector/main.js']);
  //C: attaching exit events to kill node-inspector
  ['exit','SIGINT','SIGTERM'].forEach(function (e) {
    process.on(e, function () {
      try {
        inspector.kill();
      } finally {
      }
    });
  });
}

//C: loading devtools stuff (only if development is enabled - NODE_ENV=development)
if (global.development === true) {
  //T: support custom ports (both for console and frontend)
  //C: activating node-webkit-agent for console
  var agentConsole = new (global.require(global.main.path.core + '/external/devtools/agent/index'))();
  agentConsole.start(9999, '0.0.0.0', 3333, false);
  //C: executing console frontend in a separate process
  var console = require('child_process').spawn('node', [global.main.path.core + '/external/devtools/console/main.js', 9999]);

  //T: support custom ports (both for console and frontend)
  //C: activating node-webkit-agent for profiler
  var agentProfiler = new (global.require(global.main.path.core + '/external/devtools/agent/index'))();
  agentProfiler.start(9998, '0.0.0.0', 3332, false);
  //C: executing profiler frontend in a separate process
  var profiler = require('child_process').spawn('node', [global.main.path.core + '/external/devtools/profiler/main.js', 9998]);

  //C: attaching exit events to stop agents and kill frontends
  ['exit','SIGINT','SIGTERM'].forEach(function (e) {
    process.on(e, function () {
      try {
        console.kill();
      } finally {
      }
      try {
        agentConsole.stop();
      } finally {
      }
      try {
        profiler.kill();
      } finally {
      }
      try {
        agentProfiler.stop();
      } finally {
      }
    });
  });
}
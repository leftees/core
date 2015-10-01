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

/**
 * Provides development classes and objects.
 * @namespace
*/
platform.development = platform.development || {};

/**
 * Provides development tools classes and objects.
 * @namespace
 */
platform.development.tools = platform.development.tools || {};

//? if(CLUSTER) {
if (platform.cluster.worker.master === true) {
//? }

  /**
  * Provides support for node-inspector.
  * @namespace
  */
  platform.development.tools.inspector = platform.development.tools.inspector || {};

  /**
   *  Checks whether the tool is running.
  */
  platform.development.tools.inspector._running = platform.development.tools.inspector._running || false;

  /**
   *  Contains forked child process object when running.
  */
  platform.development.tools.inspector._wrapper = platform.development.tools.inspector._wrapper || undefined;

  /**
   *  Contains forked child process object when running.
   */
  platform.development.tools.inspector._process = platform.development.tools.inspector._process || undefined;

  /**
   *  Define separated process path for inspector.
   */
  platform.development.tools.inspector._process_path = '/node_modules/ljve-inspector/bin/inspector.js';

  /**
  * Starts the Inspector tool.
  * @param {} [port] Specifies the port argument to bind for the web UI.
  * @return {} None.
 * @alert  Throws exception if tool is already running.
  */
  platform.development.tools.inspector.start = function (port) {
    if (platform.development.tools.inspector._running === false) {
        // executing tool separate process(es)
        platform.development.tools.inspector._process = require('child_process').spawn(process.execPath, [
          platform.configuration.runtime.path.core + platform.development.tools.inspector._process_path,
          '--web-host',
          '0.0.0.0',
          '--web-port',
          port || platform.configuration.development.tools.inspector.ports.ui,
          '--debug-port',
          process.debugPort,
          '--no-save-live-edit',
          '--no-preload'
        ]);
      //}
      platform.development.tools.inspector._running = true;
    } else {
      throw new Exception('inspector tool is already running');
    }
  };

  /**
  * Stops the Inspector tool.
  * @return {} None.
 * @alert  Throws exception if tool is not running.
  */
  platform.development.tools.inspector.stop = function () {
    if (platform.development.tools.inspector._running === true) {
      // killing separate process(es)
      platform.development.tools.inspector._process.kill();
      platform.development.tools.inspector._process = undefined;
      platform.development.tools.inspector._running = false;
    } else {
      throw new Exception('inspector tool is not running');
    }
  };

  if (platform.state === platform._states.PRELOAD) {

    // defining running property
    Object.defineProperty(platform.development.tools.inspector, 'running', {
      get: function () {
        return platform.development.tools.inspector._running;
      }, set: function () {
      }
    });

    // attaching exit events to kill tool
    ['exit'].forEach(function (e) {
      process.on(e, function () {
        try {
          // stopping inspector before exit
          if (platform.development.tools.inspector._running === true) {
            platform.development.tools.inspector.stop();
          }
        } catch (err) {
        }
      });
    });

  } else {

    if (platform.configuration.runtime.debugging === true) {
      platform.events.attach('core.ready','devtools.init.inspector.ui', function(){

        if (process.env.BUILD === 'pack') return;

        setTimeout(function(){
          platform.development.tools.inspector.start(platform.configuration.development.tools.inspector.ports.ui);
        },5000);

        if (process.debugActive === true) {
//? if (CLUSTER) {
          console.warn('debugger agent for node %s listening on port %s', platform.cluster.worker.id, process.debugPort);
//? } else {
          console.warn('debugger agent listening on port %s', process.debugPort);
//? }
        }
        console.warn('debugger ui available at http://localhost:%s/', platform.configuration.development.tools.inspector.ports.ui);
      });
    }

  }
//? if(CLUSTER) {
} else if (platform.state !== platform._states.PRELOAD) {

  platform.events.attach('core.ready','devtools.init.debugger', function(){

    if (process.env.BUILD === 'pack') return;

    if (process.debugActive === true) {
      console.warn('debugger agent for node %s listening on port %s', platform.cluster.worker.id, process.debugPort);
    }
  });
}
//? }

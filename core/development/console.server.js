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

/**
 * Provides support for node-webkit-agent console frontend.
 * @namespace
*/
platform.development.tools.console = platform.development.tools.console || {};

/**
 *  Checks whether the tool is running.
*/
platform.development.tools.console._running = platform.development.tools.console._running || false;

/**
 *  Contains forked child process object for agent when running.
*/
platform.development.tools.console._wrapper = platform.development.tools.console._wrapper || undefined;

/**
 *  Contains forked child process object when running.
 */
platform.development.tools.console._process = platform.development.tools.console._process || undefined;

/**
 *  Contains forked child process object for agent when running.
 */
platform.development.tools.console._agent = platform.development.tools.console._agent || undefined;

/**
 *  Define separated process path for console.
 */
platform.development.tools.console._process_path = '/node_modules/node-console/run.server.js';

/**
 *  Define agent path for inspector.
 */
platform.development.tools.console._agent_path = '/node_modules/node-console/agent.js';

/**
 *  Defines console agent port.
*/
platform.development.tools.console.port = platform.development.tools.console.port
//? if (CLUSTER) {
  || platform.configuration.development.tools.console.ports.agent
  + ((native.cluster.isMaster) ? 0 : native.cluster.worker.id);
//? } else {
  || platform.configuration.development.tools.console.ports.agent;
//? }

/**
 * Starts the specified tool.
 * @param {} [agent_port] Specifies the port argument to bind for the console agent.
 * @param {} [internal_port] Specifies the port argument to bind for the internal agent port.
 * @param {} [ui_port] Specifies the port argument to bind for the web UI.
 * @return {} None.
 * @alert  Throws exception if tool is already running.
*/
platform.development.tools.console.start = function(agent_port,ui_port){
  if (platform.development.tools.console._running === false) {
    //TODO: support custom ports (both for frontend)
    //TODO: support spawned process close detection
    // activating agent for node-webkit-agent based tools
    if (platform.configuration.development.tools.console.spawn === false) {
      if (platform.development.tools.console._wrapper === undefined) {
        platform.development.tools.console._wrapper = require('node-console');
      }
      platform.development.tools.console._wrapper.agent.start(agent_port || platform.development.tools.console.port, '0.0.0.0');
    } else {
      platform.development.tools.console._agent = global.require(platform.configuration.runtime.path.core + platform.development.tools.console._agent_path);
      platform.development.tools.console._agent.start(agent_port || platform.development.tools.console.port, '0.0.0.0');
    }
//? if(CLUSTER) {
    if (platform.cluster.worker.master === true) {
//? }
      if (platform.configuration.development.tools.console.spawn === false) {
        platform.development.tools.console._wrapper.server.start({
          webHost: '0.0.0.0',
          webPort: ui_port || platform.configuration.development.tools.inspector.ports.ui,
          debugPort: agent_port || platform.development.tools.console.port
        });
      } else {
        // executing tool separate process(es)
        platform.development.tools.console._process = require('child_process').spawn(process.execPath, [
          platform.configuration.runtime.path.core + platform.development.tools.console._process_path,
          agent_port || platform.development.tools.console.port,
          ui_port || platform.configuration.development.tools.inspector.ports.ui,
          '0.0.0.0'
        ]);
      }
//? if (CLUSTER) {
    }
//? }
    platform.development.tools.console._running = true;
  } else {
    throw new Exception('console tool is already running');
  }
};

/**
 * Stops the specified tool.
 * @return {} None.
 * @alert  Throws exception if tool is not running.
*/
platform.development.tools.console.stop = function(){
  var name = 'console';
  if (platform.development.tools.console._running === true) {
    if (platform.configuration.development.tools.console.spawn === false) {
      platform.development.tools.console._wrapper.agent.stop();
    } else {
      platform.development.tools.console._agent.stop();
      platform.development.tools.console._agent = undefined;
    }
//? if (CLUSTER) {
    if (platform.cluster.worker.master === true) {
//? }
      if (platform.configuration.development.tools.console.spawn === false) {
        platform.development.tools.console._wrapper.server.stop();
      } else {
        platform.development.tools.console._process.kill();
        platform.development.tools.console._process = undefined;
      }
//? if (CLUSTER) {
    }
//? }
    platform.development.tools.console._running = false;
  } else {
    throw new Exception('console tool is not running');
  }
};

if (platform.state === platform._states.PRELOAD) {

  // defining running property
  Object.defineProperty(platform.development.tools.console, 'running', {
    get: function () {
      return platform.development.tools.console._running;
    }, set: function () {
    }
  });

  // attaching exit events to kill tool
  ['exit'].forEach(function (e) {
    process.on(e, function () {
      try {
        // stopping console before exit
        if (platform.development.tools.console._running === true) {
          platform.development.tools.console.stop();
        }
      } catch (err) {
      }
    });
  });

} else {

  if (platform.configuration.runtime.development === true) {
    platform.events.attach('core.ready','devtools.init.console',function(){

      if (process.env.BUILD === 'pack') return;

      // starting development tools (only if development is enabled - NODE_ENV=development)
      platform.development.tools.console.start(platform.development.tools.console.port, platform.configuration.development.tools.console.ports.ui);
    });

    platform.events.attach('core.ready','devtools.init.console.ui', function(){

      if (process.env.BUILD === 'pack') return;

//? if (CLUSTER) {
      console.warn('console agent for node %s listening on port %s', platform.cluster.worker.id, platform.development.tools.console.port);
      if (platform.cluster.worker.master === true) {
        console.warn('console ui available at http://localhost:%s/', platform.configuration.development.tools.console.ports.ui);
      }
//? } else {
      console.warn('console agent listening on port %s', platform.development.tools.console.port);
      console.warn('console ui available at http://localhost:%s/', platform.configuration.development.tools.console.ports.ui);
//? }
    });
  }

}
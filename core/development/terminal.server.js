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
  * Provides support for terminal.
  * @namespace
  */
  platform.development.tools.terminal = platform.development.tools.terminal || {};

  /**
   *  Contains default options for tty.js.
   */
  platform.development.tools.terminal._options = {
    'users': {
    },
    'port': null,
    'hostname': '0.0.0.0',
    'shell': (process.platform !== 'win32') ? 'bash' : 'cmd.exe',
    'limitGlobal': 1000,
    'limitPerUser': 100,
    'localOnly': false,
    'cwd': process.cwd(),
    'syncSession': false,
    'sessionTimeout': 300000,
    'log': false,
    'debug': false,
    'term': {
      'termName': 'xterm',
      'geometry': [80, 24],
      'scrollback': 0,
      'visualBell': true,
      'popOnBell': true,
      'cursorBlink': true,
      'screenKeys': true,
      'colors': [
        '#2e3436',
        '#cc0000',
        '#4e9a06',
        '#c4a000',
        '#3465a4',
        '#75507b',
        '#06989a',
        '#d3d7cf',
        '#555753',
        '#ef2929',
        '#8ae234',
        '#fce94f',
        '#729fcf',
        '#ad7fa8',
        '#34e2e2',
        '#eeeeec'
      ]
    }
  };

  /**
   *  Checks whether the tool is running.
  */
  platform.development.tools.terminal._running = platform.development.tools.terminal._running || false;

  /**
   *  Contains forked child process object when running.
  */
  platform.development.tools.terminal._wrapper = platform.development.tools.terminal._wrapper || undefined;

  /**
   *  Contains forked child process object when running.
   */
  platform.development.tools.terminal._process = platform.development.tools.terminal._process || undefined;

  /**
   *  Define separated process path for terminal.
   */
  platform.development.tools.terminal._process_path = '/node_modules/ljve-terminal/bin/ljve-terminal';

  /**
  * Starts the terminal tool.
  * @param {} [port] Specifies the port argument to bind for the web UI.
  * @return {} None.
 * @alert  Throws exception if tool is already running.
  */
  platform.development.tools.terminal.start = function (port) {
    if (platform.development.tools.terminal._running === false) {
      platform.development.tools.terminal._options.port = port || platform.configuration.development.tools.inspector.ports.ui;
      if (platform.configuration.development.tools.terminal.spawn === false) {
        if (platform.development.tools.terminal._wrapper === undefined) {
          platform.development.tools.terminal._wrapper = require('ljve-terminal').createServer(platform.development.tools.terminal._options);
        }
        platform.development.tools.terminal._wrapper.setAuth(function(request,response,callback){
          //TODO: implement authentication integration
          callback();
        });
        platform.development.tools.terminal._wrapper.listen();
      } else {
        // saving options configuration file
        var data_fs = platform.io.store.getByName('root');
        if (data_fs.exists('/data/tty/') === false){
          data_fs.create('/data/tty/');
        }
        data_fs.set.stringSync('/data/tty/config.json',JSON.stringify(platform.development.tools.terminal._options));
        // executing tool separate process(es)
        platform.development.tools.terminal._process = require('child_process').spawn(process.execPath, [
          platform.configuration.runtime.path.core + platform.development.tools.terminal._process_path,
          '--config',
          native.path.join(data_fs.base,'/data/tty/config.json')
        ]);
      }
      platform.development.tools.terminal._running = true;
    } else {
      throw new Exception('terminal tool is already running');
    }
  };

  /**
  * Stops the terminal tool.
  * @return {} None.
 * @alert  Throws exception if tool is not running.
  */
  platform.development.tools.terminal.stop = function () {
    if (platform.development.tools.terminal._running === true) {
      if (platform.configuration.development.tools.terminal.spawn === false) {
        //TODO: check/implement stop in ljve-terminal
        //platform.development.tools.terminal._wrapper.close();
      } else {
        // killing separate process(es)
        platform.development.tools.terminal._process.kill();
        platform.development.tools.terminal._process = undefined;
      }
      platform.development.tools.terminal._running = false;
    } else {
      throw new Exception('terminal tool is not running');
    }
  };

  if (platform.state === platform._states.PRELOAD) {

    // defining running property
    Object.defineProperty(platform.development.tools.terminal, 'running', {
      get: function () {
        return platform.development.tools.terminal._running;
      }, set: function () {
      }
    });

    // attaching exit events to kill tool
    ['exit'].forEach(function (e) {
      process.on(e, function () {
        try {
          // stopping terminal before exit
          if (platform.development.tools.terminal._running === true) {
            platform.development.tools.terminal.stop();
          }
        } catch (err) {
        }
      });
    });

    if (platform.configuration.runtime.development === true) {
    platform.events.attach('core.ready','devtools.init.terminal',function(){

      if (process.env.BUILD === 'pack') return;

      // starting development tools (only if development is enabled - NODE_ENV=development)
      platform.development.tools.terminal.start(platform.configuration.development.tools.terminal.ports.ui);
    });

    platform.events.attach('core.ready','devtools.init.terminal.ui', function(){

      if (process.env.BUILD === 'pack') return;

      console.warn('terminal ui available at http://localhost:%s/', platform.configuration.development.tools.terminal.ports.ui);
    });
  }

  }
//? if(CLUSTER) {
}
//? }
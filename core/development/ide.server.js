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
 * Provides support for brackets ide.
 * @namespace
*/
platform.development.tools.ide = platform.development.tools.ide || {};

/**
 *  Checks whether the tool is running.
*/
platform.development.tools.ide._running = platform.development.tools.ide._running || false;

/**
 *  Contains forked child process object when running (as array).
*/
platform.development.tools.ide._wrapper = platform.development.tools.ide._wrapper || undefined;

/**
 *  Contains forked child process object when running (as array).
 */
platform.development.tools.ide._process = platform.development.tools.ide._process || undefined;

/**
 *  Define separated process path for brackets.io IDE.
 */
platform.development.tools.ide._process_path = '/node_modules/ljve-ide/lib/run.js';

/**
 * Starts the IDE tool.
 * @param {} [port] Specifies the port argument to bind for the web UI.
 * @return {} None.
 * @alert  Throws exception if tool is already running.
*/
platform.development.tools.ide.start = function(port){
  if (platform.development.tools.ide._running === false) {
    // checking and creating brackets data folder (temporary, it should be replace with in-browser-filesystem)
    var data_fs = platform.io.store.getByName('root');
    if (data_fs.exists('/data/ide/') === false){
      data_fs.create('/data/ide/');
    }
    if (platform.configuration.development.tools.ide.spawn === false) {
      if (platform.development.tools.ide._wrapper === undefined) {
        platform.development.tools.ide._wrapper = require('ljve-ide/lib/server');
      }
      platform.development.tools.ide._wrapper.start(
        port || platform.configuration.development.tools.ide.ports.ui,
        {
          supportDir: native.path.join(data_fs.base, '/data/ide'),
          projectsDir: platform.configuration.runtime.path.root,
          allowUserDomains: true
        }
      );
    } else {
      // executing tool separate process(es)
      platform.development.tools.ide._process = require('child_process').spawn(process.execPath, [
        platform.configuration.runtime.path.core + platform.development.tools.ide._process_path,
        '--port',
        port || platform.configuration.development.tools.ide.ports.ui,
        '--proj-dir',
        platform.configuration.runtime.path.root,
        '--supp-dir',
        native.path.join(data_fs.base,'/data/ide')
      ], { 'stdio': [ 'ignore', 'ignore',  process.stderr ] });
    }
    platform.development.tools.ide._running = true;
  } else {
    throw new Exception('ide tool is already running');
  }
};

/**
 * Stops the IDE tool.
 * @return {} None.
 * @alert  Throws exception if tool is not running.
*/
platform.development.tools.ide.stop = function(){
  if (platform.development.tools.ide._running === true) {
    if (platform.configuration.development.tools.ide.spawn === false) {
      platform.development.tools.ide._wrapper.stop();
    } else {
      // killing separate process(es)
      platform.development.tools.ide._process.kill();
      platform.development.tools.ide._process = undefined;
    }
    platform.development.tools.ide._running = false;
  } else {
    throw new Exception('ide tool is not running');
  }
};

if (platform.state === platform._states.PRELOAD) {

  // defining running property
  Object.defineProperty(platform.development.tools.ide,'running',{ get: function(){
    return platform.development.tools.ide._running;
  }, set: function(){}});

  // attaching exit events to kill tool
  ['exit'].forEach(function (e) {
    process.on(e, function () {
      try{
        // stopping ide before exit
        if (platform.development.tools.ide._running === true) {
          platform.development.tools.ide.stop();
        }
      } catch(err){}
    });
  });

  if (platform.configuration.runtime.development === true) {
    platform.events.attach('core.ready','devtools.init.ide',function(){

      if (process.env.BUILD === 'pack') return;

      // starting development tools (only if development is enabled - NODE_ENV=development)
      platform.development.tools.ide.start(platform.configuration.development.tools.ide.ports.ui);
    });

    platform.events.attach('core.ready','devtools.init.ide.ui', function(){

      if (process.env.BUILD === 'pack') return;

      console.warn('ide ui available at http://localhost:%s/', platform.configuration.development.tools.ide.ports.ui);
    });
  }
}
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

var fs = require('fs');
var path = require('path');

global.main.commands = {};
//if (process.env['MAIN_COMMAND'] == null) {
  // creating supported CLI commands hashtable (will be populated afterwards)

  // defining legacy unknown CLI command (will be overridden by modular commands loading)
  global.main.commands.unknown = function (command) {
    if (command == null) {
      console.error('missing command');
    } else {
      console.error('unsupported command %s', command);
    }
  };

  // defining legacy test_ci CLI command (will be overridden by modular commands loading)
  global.main.commands.test = function () {
    console.error('unsupported command');
  };

  // populating supported CLI commands from /core/main folder (whether exists)
  if (fs.existsSync(path.join(global.main.path.core, '/core/main')) === true) {
    // getting files available in /core/main folder
    var exec_files = fs.readdirSync(path.join(global.main.path.core, '/core/main'));
    // loading every .js files available in /core/main folder
    exec_files.forEach(function (file) {
      if (file.endsWith('.js') === true) {
        global.require.main._compile('\n' + fs.readFileSync(global.main.path.core + '/core/main/' + file, {encoding: 'utf-8'}));
      }
    });
  }

  // detecting CLI command requested by user
  var target_command = global.main.commands[process.argv[2]];
  // checking whether command doesn't exist or it's not executable
  if (!(target_command != null && typeof target_command === 'function')) {
    if (global.testing === false) {
      // selecting unknown command by default (hopefully overridden by loaded modular commands)
      global.main.commands.unknown(process.argv[2]);
    } else {
      // selecting test command by default (hopefully overridden by loaded modular commands)
      global.main.commands.test(true);
    }
  } else {
    // executing CLI command
    target_command();
  }
/*} else {
  global.require.main._compile('\n' + fs.readFileSync(global.main.path.core + '/core/main/' + process.env['MAIN_COMMAND'], {encoding: 'utf-8'}));
  global.main.commands[process.argv[2]]();
}*/
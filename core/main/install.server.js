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

global.main.commands.install = function (next_command) {
  init_npm(next_command);
};

var init_npm = function (next_command) {
  var npm;
  try {
    npm = require('npm');
    npm.load({'dev': false}, function () {
      install_deps(npm, next_command);
    });
  } catch (error) {
    var command = 'npm install npm';
    //if (process.platform !== 'win32') {
      //command = 'npm link npm';
    //}
    console.log('installing npm...');
    require('child_process').exec(command, function (error, stdout, stderr) {
      //if (error != null) {
        //throw error;
      //} else {
        npm = require('npm');
        npm.load({'dev': false}, function () {
          install_deps(npm, next_command);
        });
      //}
    });
  }
};

var install_deps = function (npm, next_command) {
  console.log('checking dependencies...');
  npm.commands.outdated([], true, function (error, info) {
    if (error != null) {
      throw error;
    } else {
      var deps_missing = [];
      var deps_outdated = [];
      info.forEach(function (data) {
        var dependency = data[1];
        var installed = data[2];
        var wanted = data[3];
        var latest = data[4];
        //TODO: compare against real version (semver?) just in case of backported upgrades
        if (installed == null) {
          deps_missing.push(dependency);
        } else if (/*installed !== latest &&*/ installed !== wanted /*&& dependency !== 'npm'*/) {
          deps_outdated.push(dependency + '@' + wanted);
        }
      });
      if (deps_outdated.length > 0) {
        console.log('upgradable dependencies: %s', deps_outdated.join(', '));
      }
      if (deps_missing.length > 0) {
        console.log('missing dependencies: %s', deps_missing.join(', '));
        console.log('installing %s missing dependencies...',deps_missing.length);
        console.log();

        if (process.platform === 'win32') {
          var npm_process = require('child_process').spawn(
            'cmd',
            ['/c', 'npm', 'install'].concat(deps_missing)
            , {
              'stdio': 'inherit'
            });
          npm_process.on('exit', function (code, signal) {
            if (code === 0) {
              done(next_command);
            } else {
              console.error('install failed, see above and retry');
            }
          });
        } else {
          npm.commands.install(deps_missing, function (error) {
            if (error != null) {
              throw error;
            } else {
              done(next_command);
            }
          });
        }
      } else {
        done(next_command);
      }
    }
  });
};

var done = function (next_command) {
  console.log('done');
  if (next_command != null) {
    var target = global.main.commands[next_command];
    if (target == null) {
      global.main.commands.unknown(next_command);
    } else {
      target();
    }
  }
};

global.main.commands.install.man = function () {
  console.log('\
  install\n\
  Install required and missing dependencies.');
};

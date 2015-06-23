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

global.main.commands.update = function (next_command) {
  init_npm(next_command);
};

var init_npm = function (next_command) {
  var npm;
  try {
    npm = require('npm');
    npm.load({'dev': false}, function () {
      update_ljve(npm, next_command);
    });
  } catch (error) {
    require('child_process').exec('npm install npm', function (error, stdout, stderr) {
      npm = require('npm');
      npm.load({'dev': false}, function () {
        update_ljve(npm, next_command);
      });
    });
  }
};

var update_ljve = function (npm, next_command) {
  if (require('fs').existsSync(require('path').join(global.main.path.core, '.git')) === false) {
    require('child_process').exec('npm -g list ljve', function (error, stdout, stderr) {
      if (error == null) {
        console.log('checking for ljve update...');
        npm.commands.show(['ljve', 'version'], true, function (error, version) {
          if (error == null) {
            var current = require('./package.json').version;
            var latest = Object.keys(version);
            //TODO: compare against real version (semver?) just in case of backported upgrades
            if (current != latest) {
              console.warn('ljve upgrade available: %s (installed %s)', latest, current);
              console.log('upgrading ljve...');
              require('child_process').exec('npm -g update ljve', function (error, stdout, stderr) {
                if (error == null) {
                  console.log(stdout);
                  console.log('ljve upgraded');
                  update_deps(npm, next_command);
                } else {
                  console.error(stderr);
                }
              });
            } else {
              update_deps(npm, next_command);
            }
          }
        });
      } else {
        console.warn('ljve upgrade skipped (local install detected)');
        update_deps(npm, next_command);
      }
    });
  } else {
    console.warn('ljve upgrade skipped (development/git mode detected)');
    update_deps(npm, next_command);
  }
};

var update_deps = function (npm, next_command) {
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
        } else if (installed !== wanted && dependency !== 'npm') {
          deps_outdated.push(dependency);
        }
      });
      if (deps_missing.length > 0) {
        console.log('missing dependencies: %s', deps_missing.join(', '));
      }
      if (deps_outdated.length > 0) {
        console.log('upgradable dependencies: %s', deps_outdated.join(', '));
        console.log('upgrading outdated dependencies');

        if (process.platform === 'win32') {
          var npm_process = require('child_process').spawn(
            'cmd',
            ['/c', 'npm', 'install'].concat(deps_outdated)
            , {
              'stdio': 'inherit'
            });
          npm_process.on('exit', function (code, signal) {
            if (code === 0) {
              done(next_command);
            } else {
              console.error('update failed, see above and retry');
            }
          });
        } else {
          npm.commands.update(deps_outdated, function () {
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

global.main.commands.update.man = function () {
  console.log('\
  update\n\
  Update application server and upgradable dependencies.');
};

/*var update_node = function (next_command) {
  var response_end = false;
  console.log('checking for iojs update...');
  require('https').get('https://iojs.org/download/release/index.json', function (response) {
    var index_json_string = '';
    if (response.statusCode === 200) {
      response.on('data', function (chunk) {
        index_json_string += chunk.toString();
      });
    } else {
      console.warn('unable to detect latest iojs version: %s', error.message);
      console.warn('aborted');
      process.exit(1);
    }
    response.on('end', function () {
      try {
        var dist = JSON.parse(index_json_string)[0];
        var latest = dist.version.substring(1);
        var current = process.version.substring(1);
        if (current != latest) {
          console.warn('iojs upgrade available: %s (installed %s)', latest, current);
          console.log('upgrading iojs...');
          var fs = require('fs');
          var path = require('path');
          var download_filebase = 'iojs-' + dist.version + '-' + process.platform + '-' + process.arch;
          var download_filename = download_filebase + '.tar.gz';
          var download_uri = 'https://iojs.org/download/release/' + dist.version + '/' + download_filename;
          var download_path = path.join(global.main.path.core, 'bin', 'node', process.platform, process.arch);
          var download_filepath = path.join(global.main.path.core, 'bin', 'node', process.platform, process.arch, download_filename);
          if (fs.existsSync(download_path) === false) {
            fs.mkdirSync(path.join(global.main.path.core, 'bin'));
            fs.mkdirSync(download_path);
          }
          require('https').get(download_uri, function (response) {
            var index_json_string = '';
            if (response.statusCode === 200) {
              var download_length = parseInt(response.headers['content-length']);
              console.log('downloading ' + download_uri + ' (' + Number.toHumanSize(download_length) + ')...');
              var donwload_stream = fs.createWriteStream(download_filepath);
              donwload_stream.on('open', function () {
                response.on('data', function (chunk) {
                  donwload_stream.write(chunk);
                });
                response.on('end', function () {
                  donwload_stream.end();
                });
                donwload_stream.on('close', function () {
                  if (fs.statSync(download_filepath).size === download_length) {
                    require('child_process').exec('tar xvf ' + download_filepath + ' -C ./bin/node/' + process.platform + '/' + process.arch, function (error, stdout, stderr) {
                      fs.unlinkSync(download_filepath);
                      if (error) {
                        console.warn('unable to extract latest iojs binaries: %s', error.message);
                        console.warn('aborted');
                        process.exit(1);
                      } else {
                        var binary_path = path.join(download_path, dist.version);
                        if (fs.existsSync(binary_path) === true) {
                          fs.renameSync(binary_path, binary_path + '.backup.' + (new Date()).toISOString().replace(/[-:.]|...Z$|T/g, ''));
                        }
                        fs.renameSync(path.join(download_path, download_filebase), binary_path);
                      }
                      console.log('done');
                      //TODO: relaunch rebuild and update to continue
                    });
                  } else {
                    console.warn('unable to get latest iojs binaries: %s', 'file size mismatch');
                    console.warn('aborted');
                    process.exit(1);
                  }
                });
              });
              donwload_stream.on('error', function () {
                console.warn('unable to get latest iojs binaries: %s', error.message);
                console.warn('aborted');
                process.exit(1);
              });
            } else {
              if (response_end === false) {
                response_end = true;
                init_npm(next_command);
              }
            }
            response.on('end', function () {

            });
          }).on('error', function (error) {
            console.warn('unable to get latest iojs binaries: %s', error.message);
            console.warn('aborted');
            process.exit(1);
          });
        } else {
          if (response_end === false) {
            response_end = true;
            init_npm(next_command);
          }
        }
      } catch (error) {
        console.warn('unable to detect latest iojs version: %s', error.message);
        console.warn('aborted');
        process.exit(1);
      }
    });
  }).on('error', function (error) {
    console.warn('unable to detect latest iojs version: %s', error.message);
    if (response_end === false) {
      response_end = true;
      init_npm(next_command);
    }
  });
};*/
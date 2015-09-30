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

var rmdirSync = function (path) {
  var fs = require('fs');
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        rmdirSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

global.main.commands['_.clean'] = function () {

  var fs = require('fs-extra');
  var path = require('path');

  if (fs.existsSync(path.join(global.main.path.core, '/dist/core/')) === true) {
    console.log('cleaning dist/core...');
    rmdirSync(path.join(global.main.path.core, '/dist/core/'));
  }
  if (fs.existsSync(path.join(global.main.path.core, '/dist/cluster/')) === true) {
    console.log('cleaning dist/cluster...');
    rmdirSync(path.join(global.main.path.core, '/dist/cluster/'));
  }
  if (fs.existsSync(path.join(global.main.path.core, '/build/')) === true) {
    console.log('cleaning build...');
    rmdirSync(path.join(global.main.path.core, '/build/'));
  }
  if (fs.existsSync(path.join(global.main.path.core, '/cache/')) === true) {
    console.log('cleaning cache...');
    rmdirSync(path.join(global.main.path.core, '/cache/'));
  }
  if (fs.existsSync(path.join(global.main.path.core, '/log/')) === true) {
    console.log('cleaning log...');
    rmdirSync(path.join(global.main.path.core, '/log/'));
  }
  if (fs.existsSync(path.join(global.main.path.core, '/tmp/')) === true) {
    console.log('cleaning tmp...');
    rmdirSync(path.join(global.main.path.core, '/tmp/'));
  }
};

// defining dev.build.cluster CLI command manual
global.main.commands['_.clean'].man = function () {
  console.log('\
  _.clean\n\
  Clean runtime, temporary and dist folders.\
  ');
};
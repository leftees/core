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

global.main.commands['_.dist.core'] = function () {

  var args = require('yargs').argv;
  var fs = require('fs-extra');
  var path = require('path');
  var async = require('neo-async');
  var child_process = require('child_process');

  var optimizer = args._[1] || args.optimizer || 'closure';

  if (fs.existsSync(path.join(global.main.path.core, '/build/pack/core.server.js')) === true) {
    if (fs.existsSync(path.join(global.main.path.core, '/dist/')) === true) {
      rmdirSync(path.join(global.main.path.core, '/dist/'));
    }
    fs.mkdirSync(path.join(global.main.path.core, '/dist/'));
    fs.mkdirSync(path.join(global.main.path.core, '/dist/docs/'));
    fs.mkdirSync(path.join(global.main.path.core, '/dist/boot/'));

    var tasks = [];

    tasks.push(function(callback) {
      child_process.spawn(process.execPath, [
        global.main.path.core + '/node_modules/ljve-jsdoc/jsdoc.js',
        global.main.path.core + '/build/pack/core.server.js',
        '-c',
        global.main.path.core + '/.jsdocrc',
        '--verbose'
      ], {
        stdio: 'inherit'
      }).on('exit',function(code,signal){
        if (code > 0) {
          callback(new Error('jsdoc generation failed'));
        } else {
          callback();
        }
      });
    });
    tasks.push(function(callback) {
      var child;
      switch (optimizer) {
        case 'uglify':
          child = child_process.spawn(process.execPath, [
            global.main.path.core + '/node_modules/uglify-js/bin/uglifyjs',
            global.main.path.core + '/build/core/bootstrap.server.js.boot',
            '-o',
            global.main.path.core + '/dist/boot/bootstrap.server.js.boot',
            //'--in-source-map',
            //global.main.path.core + '/build/core/bootstrap.server.js.boot.map',
            //'--source-map',
            //global.main.path.core + '/dist/boot/bootstrap.server.js.boot.map',
            '--acorn',
            '-c',
            //'-m',
            '-v',
            '-p',
            'relative',
            //'--source-map-include-sources'
          ], {
            stdio: 'inherit'
          });
          break;
        case 'closure':
        default:
          child = child_process.spawn('java', [
            '-jar',
            global.main.path.core + '/project/tools/compiler.jar',
            '--js',
            global.main.path.core + '/build/core/bootstrap.server.js.boot',
            '--js_output_file',
            global.main.path.core + '/dist/boot/bootstrap.server.js.boot',
            '--language_in',
            'ECMASCRIPT5',
            '--compilation_level',
            'SIMPLE_OPTIMIZATIONS'
          ], {
            stdio: 'inherit'
          });
          break;
      }
      child.on('exit',function(code,signal){
        if (code > 0) {
          callback(new Error('minification of bootstrap failed'));
        } else {
          callback();
        }
      });
    });
    ['core.server.js.boot', 'core.server.js'].forEach(function (file) {
      tasks.push(function(callback) {
        var child;
        switch (optimizer) {
          case 'uglify':
            child = child_process.spawn(process.execPath, [
              global.main.path.core + '/node_modules/uglify-js/bin/uglifyjs',
              global.main.path.core + '/build/pack/' + file,
              '-o',
              global.main.path.core + '/dist/boot/' + file + '.min',
              //'--in-source-map',
              //global.main.path.core + '/build/pack/' + file + '.map',
              //'--source-map',
              //global.main.path.core + '/dist/boot/' + file + '.map',
              '--acorn',
              '-c',
              //'-m',
              '-v',
              '-p',
              'relative',
              //'--source-map-include-sources'
            ], {
              stdio: 'inherit'
            });
            break;
          case 'closure':
          default:
            child = child_process.spawn('java', [
              '-jar',
              global.main.path.core + '/project/tools/compiler.jar',
              '--js',
              global.main.path.core + '/build/pack/' + file,
              '--js_output_file',
              global.main.path.core + '/dist/boot/' + file + '.min',
              '--language_in',
              'ECMASCRIPT5',
              '--compilation_level',
              'SIMPLE_OPTIMIZATIONS'
            ], {
              stdio: 'inherit'
            });
            break;
        }
        child.on('exit', function (code, signal) {
          if (code > 0) {
            callback(new Error('minification of core ' + file + ' failed'));
          } else {
            fs.copySync(global.main.path.core + '/build/pack/' + file,
              global.main.path.core + '/dist/boot/' + file);
            fs.copySync(global.main.path.core + '/build/pack/' + file + '.map',
              global.main.path.core + '/dist/boot/' + file + '.map');
            callback();
          }
        });
      });
    });

    async.waterfall(tasks,function(errors,results){
      if (errors == null) {
        console.log('done');
      }
    });

  } else {
    console.warn('please build before trying to generate dist files and docs');
  }
};

// defining _.dist.core CLI command manual
global.main.commands['_.dist.core'].man = function () {
  console.log('\
  _.dist.core [optimizer]\n\
  Generate dist files and API docs from pre-built/compiled core modules.\n\
  \n\
    --optimizer=uglify\n\
    Define the optimizer/minifier to use with supported values: uglify, closure.\n\
    If this argument is missing, the default optimizer is uglify.\
 ');
};
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

// defining test CLI command
global.main.commands.test = function(coverage) {

  global.development = true;
  global.testing = true;

  var args = require('yargs').argv;
  var fs = require('fs-extra');
  var path = require('path');

  // loading chai for global assert/expect/should support
  var chai = require('chai');
  chai.use(require('chai-as-promised'));
  global.assert = chai.assert;
  global.expect = chai.expect;
  global.should = chai.should();

  // loading mocha and initializing it with proper reporter (supports also coverage)
  var mocha = require('mocha');
  global.mocha = new mocha({
    'ui': 'bdd',
    'reporter': args.reporter || ((coverage === true) ? 'mocha-htmlcov-sourcemap-reporter' : 'spec')
  });

  // initializing coverage stuff if required
  if(coverage === true){
    global.mocha.addFile(path.join(global.main.path.core, 'test/coverage.js'));
  }

  global.mocha.addFile(path.join(global.main.path.core, 'test/bootstrap.js'));

  // queueing test files as specified in /test/series file
  var js_line_comment = /^\/\/.*|^#.*/;
  var series = fs.readFileSync(path.join(global.main.path.core, 'test/series'), 'utf8').split('\n');
  series.forEach(function(script){
    if (js_line_comment.test(script) === false) {
      global.mocha.addFile(path.join(global.main.path.core, 'test/scripts/', script));
    }
  });

  var root = path.join(global.main.path.root, 'tmp/test-root');
  // deleting temporary root
  //fs.removeSync(root);
  // creating temporary root for tests
  //global.main.commands.create(root,'test');

  // executing tests
  global.mocha.run(function(failures){
    if(!coverage && failures === 0){
      // deleting temporary root
      //fs.removeSync(root);
    }
    // terminating process with number of failures as exit code
    process.exit(failures);
  });

};

// defining test CLI command manual
global.main.commands.test.man = function() {
  console.log('\
  Execute tests and print progress to stdout.');
};
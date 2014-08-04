'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

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

//C: defining test CLI command
global.main.commands.test = function(coverage) {

  //C: loading chai for global assert/expect/should support
  var chai = require('chai');
  global.assert = chai.assert;
  global.expect = chai.expect;
  global.should = chai.should();

  //C: loading mocha and initializing it with proper reporter (supports also coverage)
  var mocha = require('mocha');
  global.mocha = new mocha({
    'ui': 'bdd',
    'reporter': ((coverage === true) ? ((global.testing === true) ? 'mocha-lcov-reporter' : 'html-cov') : 'list')
  });

  //C: initializing coverage stuff if required
  if(coverage === true){
    global.mocha.addFile(global.main.path.core + '/test/coverage.js');
  }

  global.mocha.addFile(global.main.path.core + '/test/bootstrap.js');

  //C: queueing test files as specified in /test/series file
  var js_line_comment = /^\/\/.*/;
  var series = native.fs.readFileSync(global.main.path.core + '/test/series', 'utf8').split('\n');
  series.forEach(function(script){
    if (js_line_comment.test(script) === false) {
      global.mocha.addFile(global.main.path.core + '/test/scripts/' + script);
    }
  });

  //C: creating temporary root for tests
  var root = global.main.path.app + '/tmp/test-root';
  global.main.commands.create(root,'test');

  //C: executing tests
  global.mocha.run(function(failures){
    //C: deleting temporary root
    native.fs.removeSync(root);
    //C: terminating process with number of failures as exit code
    process.exit(failures);
  });

};
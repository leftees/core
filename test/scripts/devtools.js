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

describe('devtools', function() {

  describe('namespace', function () {
    it('should exists', function () {
      should.exist(platform.development);
      should.exist(platform.development.tools);
    });
  });

  describe('inspector',function(){
    it('should exists', function () {
      should.exist(platform.development.tools.inspector);
    });

    it('should be running if development mode is enabled', function () {
      if (platform.runtime.debugging === true) {
        should.exist(platform.development.tools.inspector.__process__);
      } else {
        should.not.exist(platform.development.tools.inspector.__process__);
      }
    });

    if (global.debugging === true) {

      it('start when running should fail', function () {
        (function () {
          platform.development.tools.inspector.start();
        }).should.throw();
      });

      it('stop when running should succeed', function () {
        (function () {
          platform.development.tools.inspector.stop();
        }).should.not.throw();
        should.not.exist(platform.development.tools.inspector.__process__);
      });

      it('stop when not running should fail', function () {
        (function () {
          platform.development.tools.inspector.stop();
        }).should.throw();
      });

      it('start when not running should succeed', function () {
        (function () {
          platform.development.tools.inspector.start();
        }).should.not.throw();
        should.exist(platform.development.tools.inspector.__process__);
      });

      after(function(){
        platform.development.tools.inspector.stop();
      });

    }

  });

  describe('console',function(){
    it('should exists', function () {
      should.exist(platform.development.tools.console);
    });

    it('should be running if development mode is enabled', function () {
      if (platform.runtime.development === true) {
        should.exist(platform.development.tools.console.__agent__);
        should.exist(platform.development.tools.console.__process__);
      } else {
        should.not.exist(platform.development.tools.console.__agent__);
        should.not.exist(platform.development.tools.console.__process__);
        platform.development.tools.console.start();
      }
    });

    it('start when running should fail', function () {
      (function(){
        platform.development.tools.console.start();
      }).should.throw();
    });

    it('stop when running should succeed', function () {
      (function(){
        platform.development.tools.console.stop();
      }).should.not.throw();
      should.not.exist(platform.development.tools.console.__agent__);
      should.not.exist(platform.development.tools.console.__process__);
    });

    it('stop when not running should fail', function () {
      (function(){
        platform.development.tools.console.stop();
      }).should.throw();
    });

    it('start when not running should succeed', function () {
      (function(){
        platform.development.tools.console.start();
      }).should.not.throw();
      should.exist(platform.development.tools.console.__agent__);
      should.exist(platform.development.tools.console.__process__);
    });

    after(function(){
      platform.development.tools.console.stop();
    });

  });

  describe('profiler',function(){
    it('should exists', function () {
      should.exist(platform.development.tools.profiler);
    });

    it('should be running if development mode is enabled', function () {
      if (platform.runtime.development === true) {
        should.exist(platform.development.tools.profiler.__agent__);
        should.exist(platform.development.tools.profiler.__process__);
      } else {
        should.not.exist(platform.development.tools.profiler.__agent__);
        should.not.exist(platform.development.tools.profiler.__process__);
        platform.development.tools.profiler.start();
      }
    });

    it('start when running should fail', function () {
      (function(){
        platform.development.tools.profiler.start();
      }).should.throw();
    });

    it('stop when running should succeed', function () {
      (function(){
        platform.development.tools.profiler.stop();
      }).should.not.throw();
      should.not.exist(platform.development.tools.profiler.__agent__);
      should.not.exist(platform.development.tools.profiler.__process__);
    });

    it('stop when not running should fail', function () {
      (function(){
        platform.development.tools.profiler.stop();
      }).should.throw();
    });

    it('start when not running should succeed', function () {
      (function(){
        platform.development.tools.profiler.start();
      }).should.not.throw();
      should.exist(platform.development.tools.profiler.__agent__);
      should.exist(platform.development.tools.profiler.__process__);
    });

    after(function(){
      platform.development.tools.profiler.stop();
    });

  });

  describe('memory',function() {

    it('should exists', function () {
      should.exist(platform.development.tools.memory);
    });

    it('collect should succeed', function () {
      (function(){
        platform.development.tools.memory.collect();
      }).should.not.throw();
    });

    it('heap diff should succeed', function () {
      this.timeout(10000);
      (function(){
        platform.development.tools.memory.start();
        platform.development.tools.memory.stop();
      }).should.not.throw();
    });

  });

});


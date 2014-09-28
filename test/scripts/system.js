'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

describe('system',function() {

  it('namespace should exists', function () {
    should.exist(platform.system);
  });

  describe('memory',function() {

    it('should exists', function () {
      should.exist(platform.system.memory);
    });

    it('collect should succeed', function () {
      (function(){
        platform.system.memory.collect();
      }).should.not.throw();
    });

    it('heap diff should succeed', function () {
      this.timeout(10000);
      (function(){
        platform.system.memory.start();
        platform.system.memory.stop();
      }).should.not.throw();
    });

  });

});
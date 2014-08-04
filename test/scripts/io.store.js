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

describe('io', function() {

  describe('store', function() {

    var backend, backendHol, backendNop, backendNeg;

    before(function(){
      backend = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/test']);
      backendHol = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/test']);
      backendNop = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/test']);
      backendNeg = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/test']);
    });

    it('namespace should exists', function () {
      should.exist(platform.io.store);
    });

    it('register \'app\' store should fail', function () {
      (function(){
       platform.io.store.register('app',backend,1);
      }).should.throw();
    });

    it('register store with 0 priority should fail', function () {
      (function(){
        platform.io.store.register('tmp',backend,0);
      }).should.throw();
    });

    it('exist for missing store should succeed', function () {
      var result = platform.io.store.exist('donotexist');
      result.should.equal(false);
    });

    it('register should succeed', function () {
      (function(){
        platform.io.store.register('doexist',backend,2);
      }).should.not.throw();
    });

    it('register should succeed with discontinuous priority', function () {
      (function(){
        platform.io.store.register('doexistHol',backendHol,5);
      }).should.not.throw();
    });

    it('register should succeed with no priority', function () {
      (function(){
        platform.io.store.register('doexistNop',backendNop);
      }).should.not.throw();
    });

    it('register should succeed with negative priority', function () {
      (function(){
        platform.io.store.register('doexistNeg',backendNeg, -5);
      }).should.not.throw();
    });

    it('exist for existing store should succeed', function () {
      var result = platform.io.store.exist('doexist');
      result.should.equal(true);
    });

    it('register existing store should fail', function () {
      (function(){
        platform.io.store.register('doexist',backend,3);
      }).should.throw();
    });

    it('list should succeed', function () {
      var result = platform.io.store.list();
      result.length.should.equal(4);
      result[0].name.should.equal('app');
      result[1].name.should.equal('core');
      result[2].name.should.equal('doexist');
      result[3].name.should.equal('doexistHol');
    });

    it('listAll should succeed', function () {
      var result = platform.io.store.listAll();
      result.length.should.equal(7);
      result[0].name.should.equal('app');
      result[1].name.should.equal('core');
      result[2].name.should.equal('cache');
      result[3].name.should.equal('doexist');
      result[4].name.should.equal('doexistHol');
      result[5].name.should.equal('doexistNop');
      result[6].name.should.equal('doexistNeg');
    });

    it('getByName missing store should fail', function () {
      (function(){
        platform.io.store.getByName('donotexist');
      }).should.throw();
    });

    it('getByName existing store should succeed', function () {
      var result = platform.io.store.getByName('doexist');
      result.should.equal(backend);
    });

    it('getByPriority with correct priority should succeed', function () {
      var result = platform.io.store.getByPriority(3);
      result.name.should.equal('doexistHol');
    });

    it('getByPriority with wrong priority should succeed', function () {
      var result = platform.io.store.getByPriority(4);
      should.not.exist(result);
      result = platform.io.store.getByPriority();
      should.not.exist(result);
      result = platform.io.store.getByPriority(-1);
      should.not.exist(result);
    });

    it('getPriority should succeed', function () {
      var result = platform.io.store.getPriority('doexistHol');
      result.should.equal(3);
    });

    it('getPriority for missing store should fail', function () {
      (function(){
        platform.io.store.getPriority('donotexist');
      }).should.throw();
    });

    it('getPriority should succeed', function () {
      var result = platform.io.store.getPriority('doexistHol');
      result.should.equal(3);
    });

    it('setPriority for missing store should fail', function () {
      (function(){
        platform.io.store.setPriority('donotexist',6);
      }).should.throw();
    });

    it('setPriority for \'app\' store should fail', function () {
      (function(){
        platform.io.store.setPriority('app',6);
      }).should.throw();
    });

    it('setPriority to wrong priority should succeed', function () {
      var result;
      platform.io.store.setPriority('doexist');
      result = platform.io.store.getPriority('doexist');
      result.should.equal(-1);
      platform.io.store.setPriority('doexistNop',7);
      result = platform.io.store.getPriority('doexistNop');
      result.should.equal(3);
      platform.io.store.setPriority('core',2);
      result = platform.io.store.getPriority('core');
      result.should.equal(2);
      platform.io.store.setPriority('doexistNop',-1);
      result = platform.io.store.getPriority('doexistNop');
      result.should.equal(-1);
      result = platform.io.store.list();
      result.length.should.equal(3);
      result[0].name.should.equal('app');
      result[1].name.should.equal('doexistHol');
      result[2].name.should.equal('core');
    });

    it('unregister missing store should fail', function () {
      (function(){
        platform.io.store.unregister('donotexist');
      }).should.throw();
    });

    it('unregister should succeed', function () {
      (function(){
        platform.io.store.unregister('doexist');
        platform.io.store.unregister('doexistHol');
        platform.io.store.unregister('doexistNop');
        platform.io.store.unregister('doexistNeg');
        var result = platform.io.store.list();
        result.length.should.equal(2);
        result[0].name.should.equal('app');
        result[1].name.should.equal('core');
        result = platform.io.store.listAll();
        result.length.should.equal(3);
        result[0].name.should.equal('app');
        result[1].name.should.equal('core');
        result[2].name.should.equal('cache');
      }).should.not.throw();
    });

    it('unregister \'app\' store should fail', function () {
      (function(){
        platform.io.store.unregister('app');
      }).should.throw();
    });

    after(function(){
      platform.io.delete('/tmp/test');
    });

  });

});
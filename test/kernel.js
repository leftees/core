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

describe('kernel', function() {

  describe('namespace', function(){
    it('should exists', function(){
      should.exist(platform.kernel);
    });
  });

  describe('set', function() {

    it('with missing tree (and create param false) should fail', function () {
      (function () {
        platform.kernel.set('donotexist.test',null,false);
      }).should.throw();
    });

    it('with missing tree (and create param true) should succeed', function () {
      (function () {
        platform.kernel.set('doexist.test',{},true);
      }).should.not.throw();
    });

    it('with correct tree and default params should succeed', function () {
      platform.kernel.set('doexist.test0','0');
      should.exist(global.doexist.test0);
      global.doexist.test0.should.equal('0');
    });

    it('with correct tree and custom divisor should succeed', function () {
      platform.kernel.set('doexist|test1','1',false,null,'|');
      should.exist(global.doexist.test1);
      global.doexist.test1.should.equal('1');
    });

    it('with correct tree, custom root and no create should succeed', function () {
      platform.kernel.set('test2','2',false,global.doexist,'|');
      should.exist(global.doexist.test2);
      global.doexist.test2.should.equal('2');
    });

    it('with correct deep tree and explicit default params should succeed', function () {
      platform.kernel.set('doexist.testA.test0','3',true,null,'.');
      should.exist(global.doexist.testA.test0);
      global.doexist.testA.test0.should.equal('3');
    });

    it('with correct tree, custom root and custom divisor should succeed', function () {
      platform.kernel.set('testA|test1','A3',true,global.doexist,'|');
      should.exist(global.doexist.testA.test1);
      global.doexist.testA.test1.should.equal('A3');
    });

  });

  describe('get', function() {

    it('with missing tree should fail', function () {
      (function () {
        platform.kernel.get('donotexist.test',null);
      }).should.throw();
    });

    it('with missing tree should succeed', function () {
      (function () {
        platform.kernel.get('doexist.test',global);
      }).should.not.throw();
   });

    it('with correct tree and default params should succeed', function () {
      var result = platform.kernel.get('doexist.test0');
      should.exist(result);
      result.should.equal('0');
    });

    it('with correct tree and custom divisor should succeed', function () {
      var result = platform.kernel.get('doexist|test1',null,'|');
      should.exist(result);
      result.should.equal('1');
    });

    it('with correct tree, custom root and no create should succeed', function () {
      var result = platform.kernel.get('test2',global.doexist,'|');
      should.exist(result);
      result.should.equal('2');
    });

    it('with correct deep tree and explicit default params should succeed', function () {
      var result = platform.kernel.get('doexist.testA.test0',null,'.');
      should.exist(result);
      result.should.equal('3');
    });

    it('with correct tree, custom root and custom divisor should succeed', function () {
      var result = platform.kernel.get('testA|test1',global.doexist,'|');
      should.exist(result);
      result.should.equal('A3');
    });

  });

  describe('unset', function() {

    it('with missing tree should fail', function () {
      (function () {
        platform.kernel.unset('donotexist.test',null);
      }).should.throw();
      (function () {
        platform.kernel.unset('donotexist|test',false,null,'|');
      }).should.throw();
    });

    it('with missing tree should succeed', function () {
      (function () {
        platform.kernel.unset('doexist.test',global);
      }).should.not.throw();
    });

    it('with correct tree and default params should succeed', function () {
      platform.kernel.unset('doexist.test0');
      should.not.exist(global.doexist.test0);
      Object.keys(global.doexist).indexOf('test0').should.equal(-1);
    });

    it('with correct tree and custom divisor should succeed', function () {
      platform.kernel.unset('doexist|test1',null,'|');
      should.not.exist(global.doexist.test1);
      Object.keys(global.doexist).indexOf('test1').should.equal(-1);
    });

    it('with correct tree, custom root and no create should succeed', function () {
      platform.kernel.unset('test2',global.doexist,'|');
      should.not.exist(global.doexist.test2);
      Object.keys(global.doexist).indexOf('test2').should.equal(-1);
    });

    it('with correct deep tree and explicit default params should succeed', function () {
      platform.kernel.unset('doexist.testA.test0',null,'.');
      should.not.exist(global.doexist.testA.test0);
      Object.keys(global.doexist.testA).indexOf('test0').should.equal(-1);
    });

    it('with correct tree, custom root and custom divisor should succeed', function () {
      platform.kernel.unset('testA|test1',global.doexist,'|');
      should.not.exist(global.doexist.test1);
      Object.keys(global.doexist.testA).indexOf('test1').should.equal(-1);
    });

  });

  describe('invoke', function() {

    before(function(){
      platform.kernel.set('doexist.fail',false);
      platform.kernel.set('doexist.test',function(a){ return a; });
      platform.kernel.set('doexist.testA.test',function(a){ return a; });
    });

    it('with missing tree should fail', function () {
      (function () {
        platform.kernel.invoke('donotexist.test');
      }).should.throw();
    });

    it('with missing tree should succeed', function () {
      (function () {
        platform.kernel.invoke('doexist.test');
      }).should.not.throw();
    });

    it('with correct tree and invalid function should fail', function () {
      (function () {
        platform.kernel.invoke('doexist.fail');
      }).should.throw();
    });

    it('with correct tree and no args should succeed', function () {
      var result = platform.kernel.invoke('doexist.test');
      should.not.exist(result);
    });

    it('with correct tree and custom divisor should succeed', function () {
      var result = platform.kernel.invoke('doexist|test',['1'],null,null,'|');
      should.exist(result);
      result.should.equal('1');
    });

    it('with correct tree, custom root and no create should succeed', function () {
      var result = platform.kernel.invoke('test',['2'],null,global.doexist,'|');
      should.exist(result);
      result.should.equal('2');
    });

    it('with correct deep tree and explicit default params should succeed', function () {
      var result = platform.kernel.invoke('doexist.testA.test',['3'],null,null,'.');
      should.exist(result);
      result.should.equal('3');
    });

    it('with correct tree, custom root and custom divisor should succeed', function () {
      var result = platform.kernel.invoke('testA|test',['A'],null,global.doexist,'|');
      should.exist(result);
      result.should.equal('A');
    });

    after(function(){
      platform.kernel.unset('doexist');
    });

  });

  describe('inject', function() {

    it('with return value and default args should succeed', function () {
      var result = platform.kernel.inject('true;');
      should.exist(result);
      result.should.equal(true);
    });

    it('with function return value and default args should succeed', function () {
      var result = platform.kernel.inject('(function() { return true; })()');
      should.exist(result);
      result.should.equal(true);
    });

    it('with return value, no file, no module and preprocess enabled should succeed', function () {
      var result = platform.kernel.inject('true;',null,null,true);
      should.exist(result);
      result.should.equal(true);
    });

    it('with function return value, no file, no module and preprocess enabled  should succeed', function () {
      var result = platform.kernel.inject('(function() { return true; })()',null,null,true);
      should.exist(result);
      result.should.equal(true);
    });

    //T: add tests for preprocessing

  });

});


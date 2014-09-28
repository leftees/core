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

describe('classes', function() {

  it('namespace should exists', function () {
    should.exist(platform.classes);
  });

  it('register new class should succeed', function () {
    (function () {
      var test_myclass = function(a,b){
        this.member1 = a;
        this._member2 = b;
      };
      test_myclass.prototype.member2 = function(){
        return this._member2;
      };
      platform.classes.register('test.myclass',test_myclass);
    }).should.not.throw();
  });

  it('register existing class should fail', function () {
    (function () {
      var test_myclass = function(a,b){
        this.member1 = a;
        this._member2 = b;
      };
      test_myclass.prototype.member2 = function(){
        return this._member2;
      };
      platform.classes.register('test.myclass',test_myclass);
    }).should.throw();
  });

  it('exist for existing class should return true', function () {
    var result = platform.classes.exist('test.myclass');
    should.exist(result);
    result.should.equal(true);
  });

  it('exist for missing class should return false', function () {
    var result = platform.classes.exist('test.yourclass');
    should.exist(result);
    result.should.equal(false);
  });

  it('get for existing class should succeed', function () {
    (function () {
      platform.classes.get('test.myclass');
    }).should.not.throw();
  });

  it('get for missing class should fail', function () {
    (function () {
      platform.classes.get('test.yourclass');
    }).should.throw();
  });

  it('instanceOf for correct class should return true', function () {
    var constructor = platform.classes.get('test.myclass');
    var instance = new constructor();
    var result = platform.classes.instanceOf(instance,'test.myclass');
    should.exist(result);
    result.should.equal(true);
  });

  it('instanceOf for wrong class should return true', function () {
    var constructor = platform.classes.get('test.myclass');
    var instance = new constructor();
    var result = platform.classes.instanceOf(instance,'test.yourclass');
    should.exist(result);
    result.should.equal(false);
  });

  it('unregister missing class should fail', function () {
    (function () {
      platform.classes.unregister('test.yourclass');
    }).should.throw();
  });

  it('unregister existing class should succeed', function () {
    (function () {
      platform.classes.unregister('test.myclass');
    }).should.not.throw();
  });

});

describe('kernel', function() {

  describe('new', function() {

    before(function(){
      var test_myclass = function(a,b){
        this.member1 = a;
        this._member2 = b;
      };
      test_myclass.prototype.member2 = function(){
        return this._member2;
      };
      platform.classes.register('test.myclass',test_myclass);
      platform.kernel.set('doexist.test',test_myclass);
    });

    it('with missing tree should fail', function () {
      (function () {
        platform.kernel.new('donotexist.test');
      }).should.throw();
    });

    it('with missing tree should succeed', function () {
      (function () {
        platform.kernel.new('doexist.test');
      }).should.not.throw();
    });

    it('with registered name and constructor args should succeed', function () {
      var result = platform.kernel.new('test.myclass',['1','2']);
      result.should.be.an.instanceOf(platform.classes.get('test.myclass'));
      result.member1.should.equal('1');
      result.member2().should.equal('2');
    });

    it('with correct tree and constructor args should succeed', function () {
      var result = platform.kernel.new('test',['3','4'],global.doexist);
      result.should.be.an.instanceOf(doexist.test);
      result.member1.should.equal('3');
      result.member2().should.equal('4');
    });

    after(function(){
      platform.kernel.unset('doexist');
      platform.classes.unregister('test.myclass');
    });

  });

});


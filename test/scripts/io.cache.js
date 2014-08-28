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

  describe('cache', function () {

    before(function(){
      platform.io.create('/tmp/doexist.txt');
      platform.io.cache._backend.delete('/');
      platform.io.cache._backend.create('/');
    });

    it('namespace should exists', function () {
      should.exist(platform.io.cache);
    });

    it('backend should exist', function () {
      var result = platform.io.cache._backend;
      should.exist(result);
    });


    describe('sync', function(){

      it('missing file should not be cached',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt');
        result.should.equal(false);
      });

      it('missing file should not have been cached',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached missing file should fail', function () {
        (function(){
          platform.io.cache.get.string('/tmp/donotexist.txt',null,true);
        }).should.throw();
      });

      it('get decompressed data as bytes for not-cached missing file should fail', function () {
        (function(){
          platform.io.cache.get.bytes('/tmp/donotexist.txt',null,true);
        }).should.throw();
      });

      it('get decompressed data as stream for not-cached missing file should fail', function () {
        (function(){
          platform.io.cache.get.stream('/tmp/donotexist.txt',null,true);
        }).should.throw();
      });

      it('got decompressed data as string for not-cached missing file should fail', function () {
        (function(){
          platform.io.cache.got.string('/tmp/donotexist.txt',null,true);
        }).should.throw();
      });

      it('got decompressed data as bytes for not-cached missing file should fail', function () {
        (function(){
          platform.io.cache.got.bytes('/tmp/donotexist.txt',null,true);
        }).should.throw();
      });

      it('got decompressed data as stream for not-cached missing file should fail', function () {
        (function(){
          platform.io.cache.got.stream('/tmp/donotexist.txt',null,true);
        }).should.throw();
      });

      it('set cache data as string for missing file should succeed', function () {
        (function(){
          platform.io.cache.set.string('/tmp/donotexist.txt',null,'test€');
        }).should.not.throw();
      });

      it('missing file should be cached',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt');
        result.should.equal(true);
      });

      it('missing file should have been cached',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt');
        result.should.equal(true);
      });

      it('get cache data as string for missing file should succeed and content should be correct', function () {
        var result = platform.io.cache.get.string('/tmp/donotexist.txt',null,true);
        result.should.equal('test€');
      });

      it('set cache data as bytes for missing file should succeed', function () {
        (function(){
          platform.io.cache.set.bytes('/tmp/donotexist.txt',null,new Buffer('test€','ucs2'));
        }).should.not.throw();
      });

      it('get cache data as bytes for missing file should succeed and content should be correct', function () {
        var result = platform.io.cache.get.bytes('/tmp/donotexist.txt',null,true);
        result.toString('ucs2').should.equal('test€');
      });

      it('get cache data write stream for missing file should succeed and content should be successfully written', function (done) {
        var wstream = platform.io.cache.set.stream('/tmp/donotexist.txt',null);
        wstream.on('error', function (err) {
          done(err);
        });
        wstream.on('open', function () {
          wstream.write('test€');
          wstream.end();
        });
        wstream.on('finish', function(){
          done();
        });
      });

      it('get cache data read stream for missing file should succeed and content should be correct', function (done) {
        var rstream = platform.io.cache.get.stream('/tmp/donotexist.txt',null,true);
        rstream.on('error', function (err) {
          done(err);
        });
        var rbuffer = new Buffer(0);
        rstream.on('data',function(chunk){
          rbuffer = Buffer.concat([rbuffer,chunk]);
        });
        rstream.on('end',function(){
          if (rbuffer.toString() === 'test€') {
            done();
          }
        });
      });

      it('unset for missing file should succeed',function(){
        var result = platform.io.cache.unset('/tmp/donotexist.txt');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/donotexist.txt');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/donotexist.txt');
        result.should.equal(false);
      });

      it('existing file should not be cached',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt');
        result.should.equal(false);
      });

      it('existing file should not have been cached',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached existing file should fail', function () {
        (function(){
          platform.io.cache.get.string('/tmp/doexist.txt',null,true);
        }).should.throw();
      });

      it('get decompressed data as bytes for not-cached existing file should fail', function () {
        (function(){
          platform.io.cache.get.bytes('/tmp/doexist.txt',null,true);
        }).should.throw();
      });

      it('get decompressed data as stream for not-cached existing file should fail', function () {
        (function(){
          platform.io.cache.get.stream('/tmp/doexist.txt',null,true);
        }).should.throw();
      });

      it('got decompressed data as string for not-cached existing file should fail', function () {
        (function(){
          platform.io.cache.got.string('/tmp/doexist.txt',null,true);
        }).should.throw();
      });

      it('got decompressed data as bytes for not-cached existing file should fail', function () {
        (function(){
          platform.io.cache.got.bytes('/tmp/doexist.txt',null,true);
        }).should.throw();
      });

      it('got decompressed data as stream for not-cached existing file should fail', function () {
        (function(){
          platform.io.cache.got.stream('/tmp/doexist.txt',null,true);
        }).should.throw();
      });

      it('set cache data as string for existing file should succeed', function () {
        (function(){
          platform.io.cache.set.string('/tmp/doexist.txt',null,'test€');
        }).should.not.throw();
      });

      it('existing file should be cached',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt');
        result.should.equal(true);
      });

      it('existing file should have been cached',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt');
        result.should.equal(true);
      });

      it('get cache data as string for existing file should succeed and content should be correct', function () {
        var result = platform.io.cache.get.string('/tmp/doexist.txt',null,true);
        result.should.equal('test€');
      });

      it('existing file should not be cached after change',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test$');
          var result = platform.io.cache.is('/tmp/doexist.txt');
          result.should.equal(false);
          done();
        },1000);
      });

      it('existing file should have been cached',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test€');
          var result = platform.io.cache.was('/tmp/doexist.txt');
          result.should.equal(true);
          done();
        },1000);
      });

      it('got cache data as string for existing file should succeed and content should be correct', function () {
        var result = platform.io.cache.got.string('/tmp/doexist.txt',null,true);
        result.should.equal('test€');
      });

      it('got cache data as bytes for existing file should succeed and content should be correct', function () {
        var result = platform.io.cache.got.bytes('/tmp/doexist.txt',null,true);
        result.toString('utf8').should.equal('test€');
      });

      it('got cache data read stream for existing file should succeed and content should be correct', function (done) {
        var rstream = platform.io.cache.got.stream('/tmp/doexist.txt',null,true);
        rstream.on('error', function (err) {
          done(err);
        });
        var rbuffer = new Buffer(0);
        rstream.on('data',function(chunk){
          rbuffer = Buffer.concat([rbuffer,chunk]);
        });
        rstream.on('end',function(){
          if (rbuffer.toString() === 'test€') {
            done();
          }
        });
      });

      it('set cache data as bytes for existing file should succeed', function () {
        (function(){
          platform.io.cache.set.bytes('/tmp/doexist.txt',null,new Buffer('test€','ucs2'));
        }).should.not.throw();
      });

      it('get cache data as bytes for existing file should succeed and content should be correct', function () {
        var result = platform.io.cache.get.bytes('/tmp/doexist.txt',null,true);
        result.toString('ucs2').should.equal('test€');
      });

      it('get cache data write stream for existing file should succeed and content should be successfully written', function (done) {
        var wstream = platform.io.cache.set.stream('/tmp/doexist.txt',null);
        wstream.on('error', function (err) {
          done(err);
        });
        wstream.on('open', function () {
          wstream.write('test€');
          wstream.end();
        });
        wstream.on('finish',function(){
          done();
        });
      });

      it('get cache data read stream for existing file should succeed and content should be correct', function (done) {
        var rstream = platform.io.cache.get.stream('/tmp/doexist.txt',null,true);
        rstream.on('error', function (err) {
          done(err);
        });
        var rbuffer = new Buffer(0);
        rstream.on('data',function(chunk){
          rbuffer = Buffer.concat([rbuffer,chunk]);
        });
        rstream.on('end',function(){
          if (rbuffer.toString() === 'test€') {
            done();
          }
        });
      });

      it('unset for existing file should succeed',function(){
        var result = platform.io.cache.unset('/tmp/doexist.txt');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/doexist.txt');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/doexist.txt');
        result.should.equal(false);
      });

      it('missing file should not be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt','t');
        result.should.equal(false);
      });

      it('missing file should not have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt','t');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached missing file should fail with tag', function () {
        (function(){
          platform.io.cache.get.string('/tmp/donotexist.txt','t',true);
        }).should.throw();
      });

      it('get decompressed data as bytes for not-cached missing file should fail with tag', function () {
        (function(){
          platform.io.cache.get.bytes('/tmp/donotexist.txt','t',true);
        }).should.throw();
      });

      it('get decompressed data as stream for not-cached missing file should fail with tag', function () {
        (function(){
          platform.io.cache.get.stream('/tmp/donotexist.txt','t',true);
        }).should.throw();
      });

      it('got decompressed data as string for not-cached missing file should fail with tag', function () {
        (function(){
          platform.io.cache.got.string('/tmp/donotexist.txt','t',true);
        }).should.throw();
      });

      it('got decompressed data as bytes for not-cached missing file should fail with tag', function () {
        (function(){
          platform.io.cache.got.bytes('/tmp/donotexist.txt','t',true);
        }).should.throw();
      });

      it('got decompressed data as stream for not-cached missing file should fail with tag', function () {
        (function(){
          platform.io.cache.got.stream('/tmp/donotexist.txt','t',true);
        }).should.throw();
      });

      it('set cache data as string for missing file should succeed with tag', function () {
        (function(){
          platform.io.cache.set.string('/tmp/donotexist.txt','t','test€');
        }).should.not.throw();
      });

      it('missing file should be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt','t');
        result.should.equal(true);
      });

      it('missing file should have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt','t');
        result.should.equal(true);
      });

      it('get cache data as string for missing file should succeed and content should be correct with tag', function () {
        var result = platform.io.cache.get.string('/tmp/donotexist.txt','t',true);
        result.should.equal('test€');
      });

      it('set cache data as bytes for missing file should succeed with tag', function () {
        (function(){
          platform.io.cache.set.bytes('/tmp/donotexist.txt','t',new Buffer('test€','ucs2'));
        }).should.not.throw();
      });

      it('get cache data as bytes for missing file should succeed and content should be correct with tag', function () {
        var result = platform.io.cache.get.bytes('/tmp/donotexist.txt','t',true);
        result.toString('ucs2').should.equal('test€');
      });

      it('get cache data write stream for missing file should succeed and content should be successfully written with tag', function (done) {
        var wstream = platform.io.cache.set.stream('/tmp/donotexist.txt','t');
        wstream.on('error', function (err) {
          done(err);
        });
        wstream.on('open',function() {
          wstream.write('test€');
          wstream.end();
        });
        wstream.on('finish',function(){
          done();
        });
      });

      it('get cache data read stream for missing file should succeed and content should be correct with tag', function (done) {
        var rstream = platform.io.cache.get.stream('/tmp/donotexist.txt','t',true);
        rstream.on('error', function (err) {
          done(err);
        });
        var rbuffer = new Buffer(0);
        rstream.on('data',function(chunk){
          rbuffer = Buffer.concat([rbuffer,chunk]);
        });
        rstream.on('end',function(){
          if (rbuffer.toString() === 'test€') {
            done();
          }
        });
      });

      it('unset for missing file should succeed with tag',function(){
        var result = platform.io.cache.unset('/tmp/donotexist.txt','t');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/donotexist.txt','t');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/donotexist.txt','t');
        result.should.equal(false);
      });

      it('existing file should not be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt','t');
        result.should.equal(false);
      });

      it('existing file should not have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt','t');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached existing file should fail with tag', function () {
        (function(){
          platform.io.cache.get.string('/tmp/doexist.txt','t',true);
        }).should.throw();
      });

      it('get decompressed data as bytes for not-cached existing file should fail with tag', function () {
        (function(){
          platform.io.cache.get.bytes('/tmp/doexist.txt','t',true);
        }).should.throw();
      });

      it('get decompressed data as stream for not-cached existing file should fail with tag', function () {
        (function(){
          platform.io.cache.get.stream('/tmp/doexist.txt','t',true);
        }).should.throw();
      });

      it('got decompressed data as string for not-cached existing file should fail with tag', function () {
        (function(){
          platform.io.cache.got.string('/tmp/doexist.txt','t',true);
        }).should.throw();
      });

      it('got decompressed data as bytes for not-cached existing file should fail with tag', function () {
        (function(){
          platform.io.cache.got.bytes('/tmp/doexist.txt','t',true);
        }).should.throw();
      });

      it('got decompressed data as stream for not-cached existing file should fail with tag', function () {
        (function(){
          platform.io.cache.got.stream('/tmp/doexist.txt','t',true);
        }).should.throw();
      });

      it('set cache data as string for existing file should succeed with tag', function () {
        (function(){
          platform.io.cache.set.string('/tmp/doexist.txt','t','test€');
        }).should.not.throw();
      });

      it('existing file should be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt','t');
        result.should.equal(true);
      });

      it('existing file should have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt','t');
        result.should.equal(true);
      });

      it('get cache data as string for existing file should succeed and content should be correct with tag', function () {
        var result = platform.io.cache.get.string('/tmp/doexist.txt','t',true);
        result.should.equal('test€');
      });

      it('existing file should not be cached after change with tag',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test$');
          var result = platform.io.cache.is('/tmp/doexist.txt','t');
          result.should.equal(false);
          done();
        },1000);
      });

      it('existing file should have been cached with tag',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test€');
          var result = platform.io.cache.was('/tmp/doexist.txt','t');
          result.should.equal(true);
          done();
        },1000);
      });

      it('got cache data as string for existing file should succeed and content should be correct with tag', function () {
        var result = platform.io.cache.got.string('/tmp/doexist.txt','t',true);
        result.should.equal('test€');
      });

      it('got cache data as bytes for existing file should succeed and content should be correct with tag', function () {
        var result = platform.io.cache.got.bytes('/tmp/doexist.txt','t',true);
        result.toString('utf8').should.equal('test€');
      });

      it('got cache data read stream for existing file should succeed and content should be correct with tag', function (done) {
        var rstream = platform.io.cache.got.stream('/tmp/doexist.txt','t',true);
        rstream.on('error', function (err) {
          done(err);
        });
        var rbuffer = new Buffer(0);
        rstream.on('data',function(chunk){
          rbuffer = Buffer.concat([rbuffer,chunk]);
        });
        rstream.on('end',function(){
          if (rbuffer.toString() === 'test€') {
            done();
          }
        });
      });

      it('set cache data as bytes for existing file should succeed with tag', function () {
        (function(){
          platform.io.cache.set.bytes('/tmp/doexist.txt','t',new Buffer('test€','ucs2'));
        }).should.not.throw();
      });

      it('get cache data as bytes for existing file should succeed and content should be correct with tag', function () {
        var result = platform.io.cache.get.bytes('/tmp/doexist.txt','t',true);
        result.toString('ucs2').should.equal('test€');
      });

      it('get cache data write stream for existing file should succeed and content should be successfully written with tag', function (done) {
        var wstream = platform.io.cache.set.stream('/tmp/doexist.txt','t');
        wstream.on('error', function (err) {
          done(err);
        });
        wstream.on('open', function() {
          wstream.write('test€');
          wstream.end();
        });
        wstream.on('finish',function(){
          done();
        });
      });

      it('get cache data read stream for existing file should succeed and content should be correct with tag', function (done) {
        var rstream = platform.io.cache.get.stream('/tmp/doexist.txt','t',true);
        rstream.on('error', function (err) {
          done(err);
        });
        var rbuffer = new Buffer(0);
        rstream.on('data',function(chunk){
          rbuffer = Buffer.concat([rbuffer,chunk]);
        });
        rstream.on('end',function(){
          if (rbuffer.toString() === 'test€') {
            done();
          }
        });
      });

      it('unset for existing file should succeed with tag',function(){
        var result = platform.io.cache.unset('/tmp/doexist.txt','t');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/doexist.txt','t');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/doexist.txt','t');
        result.should.equal(false);
      });

      it('clean should succeed', function () {
        platform.io.cache.clean();
        var result = platform.io.cache._backend.list('/',true);
        result.should.deep.equal([]);
      });

      after(function(){
        platform.io.delete('/tmp/doexist.txt');
      });

    });

    describe('async', function(){

      it('missing file should not be cached',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt');
        result.should.equal(false);
      });

      it('missing file should not have been cached',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached missing file should fail', function (done) {
        platform.io.cache.get.string('/tmp/donotexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as bytes for not-cached missing file should fail', function (done) {
        platform.io.cache.get.bytes('/tmp/donotexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as stream for not-cached missing file should fail', function (done) {
        platform.io.cache.get.stream('/tmp/donotexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as string for not-cached missing file should fail', function (done) {
        platform.io.cache.got.string('/tmp/donotexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as bytes for not-cached missing file should fail', function (done) {
        platform.io.cache.got.bytes('/tmp/donotexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as stream for not-cached missing file should fail', function (done) {
        platform.io.cache.got.stream('/tmp/donotexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('set cache data as string for missing file should succeed', function (done) {
        platform.io.cache.set.string('/tmp/donotexist.txt',null,'test€',function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('missing file should be cached',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt');
        result.should.equal(true);
      });

      it('missing file should have been cached',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt');
        result.should.equal(true);
      });

      it('get cache data as string for missing file should succeed and content should be correct', function (done) {
        platform.io.cache.get.string('/tmp/donotexist.txt',null,true,function(err,result){
          result.should.equal('test€');
          done();
        });
      });

      it('set cache data as bytes for missing file should succeed', function (done) {
        platform.io.cache.set.bytes('/tmp/donotexist.txt',null,new Buffer('test€','ucs2'),function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('get cache data as bytes for missing file should succeed and content should be correct', function (done) {
        platform.io.cache.get.bytes('/tmp/donotexist.txt',null,true,function(err,result){
          result.toString('ucs2').should.equal('test€');
          done();
        });
      });

      it('get cache data write stream for missing file should succeed and content should be successfully written', function (done) {
        platform.io.cache.set.stream('/tmp/donotexist.txt',null,function(err,wstream){
          wstream.on('error', function (err) {
            done(err);
          });
          wstream.write('test€');
          wstream.flush();
          done();
        });
      });

      it('get cache data read stream for missing file should succeed and content should be correct', function (done) {
        platform.io.cache.get.stream('/tmp/donotexist.txt',null,true,function(err,rstream){
          rstream.on('error', function (err) {
            done(err);
          });
          var rbuffer = new Buffer(0);
          rstream.on('data',function(chunk){
            rbuffer = Buffer.concat([rbuffer,chunk]);
          });
          rstream.on('end',function(){
            if (rbuffer.toString() === 'test€') {
              done();
            }
          });
        });
      });

      it('unset for missing file should succeed',function(){
        var result = platform.io.cache.unset('/tmp/donotexist.txt');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/donotexist.txt');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/donotexist.txt');
        result.should.equal(false);
      });

      it('existing file should not be cached',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt');
        result.should.equal(false);
      });

      it('existing file should not have been cached',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached existing file should fail', function (done) {
        platform.io.cache.get.string('/tmp/doexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as bytes for not-cached existing file should fail', function (done) {
        platform.io.cache.get.bytes('/tmp/doexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as stream for not-cached existing file should fail', function (done) {
        platform.io.cache.get.stream('/tmp/doexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as string for not-cached existing file should fail', function (done) {
        platform.io.cache.got.string('/tmp/doexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as bytes for not-cached existing file should fail', function (done) {
        platform.io.cache.got.bytes('/tmp/doexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as stream for not-cached existing file should fail', function (done) {
        platform.io.cache.got.stream('/tmp/doexist.txt',null,true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('set cache data as string for existing file should succeed', function (done) {
        platform.io.cache.set.string('/tmp/doexist.txt',null,'test€',function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('existing file should be cached',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt');
        result.should.equal(true);
      });

      it('existing file should have been cached',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt');
        result.should.equal(true);
      });

      it('get cache data as string for existing file should succeed and content should be correct', function (done) {
        platform.io.cache.get.string('/tmp/doexist.txt',null,true,function(err,result){
          result.should.equal('test€');
          done();
        });
      });

      it('existing file should not be cached after change',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test$');
          var result = platform.io.cache.is('/tmp/doexist.txt');
          result.should.equal(false);
          done();
        },1000);
      });

      it('existing file should have been cached',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test€');
          var result = platform.io.cache.was('/tmp/doexist.txt');
          result.should.equal(true);
          done();
        },1000);
      });

      it('got cache data as string for existing file should succeed and content should be correct', function (done) {
        platform.io.cache.got.string('/tmp/doexist.txt',null,true,function(err,result){
          result.should.equal('test€');
          done();
        });
      });

      it('got cache data as bytes for existing file should succeed and content should be correct', function (done) {
        platform.io.cache.got.bytes('/tmp/doexist.txt',null,true,function(err,result){
          result.toString('utf8').should.equal('test€');
          done();
        });
      });

      it('got cache data read stream for existing file should succeed and content should be correct', function (done) {
        platform.io.cache.got.stream('/tmp/doexist.txt',null,true,function(err,rstream){
          rstream.on('error', function (err) {
            done(err);
          });
          var rbuffer = new Buffer(0);
          rstream.on('data',function(chunk){
            rbuffer = Buffer.concat([rbuffer,chunk]);
          });
          rstream.on('end',function(){
            if (rbuffer.toString() === 'test€') {
              done();
            }
          });
        });
      });

      it('set cache data as bytes for existing file should succeed', function (done) {
        platform.io.cache.set.bytes('/tmp/doexist.txt',null,new Buffer('test€','ucs2'),function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('get cache data as bytes for existing file should succeed and content should be correct', function (done) {
        platform.io.cache.get.bytes('/tmp/doexist.txt',null,true,function(err,result){
          result.toString('ucs2').should.equal('test€');
          done();
        });
      });

      it('get cache data write stream for existing file should succeed and content should be successfully written', function (done) {
        platform.io.cache.set.stream('/tmp/doexist.txt',null,function(err,wstream){
          wstream.on('error', function (err) {
            done(err);
          });
          wstream.write('test€');
          wstream.flush();
          done();
        });
      });

      it('get cache data read stream for existing file should succeed and content should be correct', function (done) {
        platform.io.cache.get.stream('/tmp/doexist.txt',null,true,function(err,rstream){
          rstream.on('error', function (err) {
            done(err);
          });
          var rbuffer = new Buffer(0);
          rstream.on('data',function(chunk){
            rbuffer = Buffer.concat([rbuffer,chunk]);
          });
          rstream.on('end',function(){
            if (rbuffer.toString() === 'test€') {
              done();
            }
          });
        });
      });

      it('unset for existing file should succeed',function(){
        var result = platform.io.cache.unset('/tmp/doexist.txt');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/doexist.txt');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/doexist.txt');
        result.should.equal(false);
      });

      it('missing file should not be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt','t');
        result.should.equal(false);
      });

      it('missing file should not have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt','t');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached missing file should fail with tag', function (done) {
        platform.io.cache.get.string('/tmp/donotexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as bytes for not-cached missing file should fail with tag', function (done) {
        platform.io.cache.get.bytes('/tmp/donotexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as stream for not-cached missing file should fail with tag', function (done) {
        platform.io.cache.get.stream('/tmp/donotexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as string for not-cached missing file should fail with tag', function (done) {
        platform.io.cache.got.string('/tmp/donotexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as bytes for not-cached missing file should fail with tag', function (done) {
        platform.io.cache.got.bytes('/tmp/donotexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as stream for not-cached missing file should fail with tag', function (done) {
        platform.io.cache.got.stream('/tmp/donotexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('set cache data as string for missing file should succeed with tag', function (done) {
        platform.io.cache.set.string('/tmp/donotexist.txt','t','test€',function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('missing file should be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/donotexist.txt','t');
        result.should.equal(true);
      });

      it('missing file should have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/donotexist.txt','t');
        result.should.equal(true);
      });

      it('get cache data as string for missing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.get.string('/tmp/donotexist.txt','t',true,function(err,result){
          result.should.equal('test€');
          done();
        });
      });

      it('set cache data as bytes for missing file should succeed with tag', function (done) {
        platform.io.cache.set.bytes('/tmp/donotexist.txt','t',new Buffer('test€','ucs2'),function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('get cache data as bytes for missing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.get.bytes('/tmp/donotexist.txt','t',true,function(err,result){
          result.toString('ucs2').should.equal('test€');
          done();
        });
      });

      it('get cache data write stream for missing file should succeed and content should be successfully written with tag', function (done) {
        platform.io.cache.set.stream('/tmp/donotexist.txt','t',function(err,wstream){
          wstream.on('error', function (err) {
            done(err);
          });
          wstream.write('test€');
          wstream.flush();
          done();
        });
      });

      it('get cache data read stream for missing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.get.stream('/tmp/donotexist.txt','t',true,function(err,rstream){
          rstream.on('error', function (err) {
            done(err);
          });
          var rbuffer = new Buffer(0);
          rstream.on('data',function(chunk){
            rbuffer = Buffer.concat([rbuffer,chunk]);
          });
          rstream.on('end',function(){
            if (rbuffer.toString() === 'test€') {
              done();
            }
          });
        });
      });

      it('unset for missing file should succeed with tag',function(){
        var result = platform.io.cache.unset('/tmp/donotexist.txt','t');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/donotexist.txt','t');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/donotexist.txt','t');
        result.should.equal(false);
      });

      it('existing file should not be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt','t');
        result.should.equal(false);
      });

      it('existing file should not have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt','t');
        result.should.equal(false);
      });

      it('get decompressed data as string for not-cached existing file should fail with tag', function (done) {
        platform.io.cache.get.string('/tmp/doexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as bytes for not-cached existing file should fail with tag', function (done) {
        platform.io.cache.get.bytes('/tmp/doexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('get decompressed data as stream for not-cached existing file should fail with tag', function (done) {
        platform.io.cache.get.stream('/tmp/doexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as string for not-cached existing file should fail with tag', function (done) {
        platform.io.cache.got.string('/tmp/doexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as bytes for not-cached existing file should fail with tag', function (done) {
        platform.io.cache.got.bytes('/tmp/doexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('got decompressed data as stream for not-cached existing file should fail with tag', function (done) {
        platform.io.cache.got.stream('/tmp/doexist.txt','t',true,function(err,result){
          if (err) {
            done();
          }
        });
      });

      it('set cache data as string for existing file should succeed with tag', function (done) {
        platform.io.cache.set.string('/tmp/doexist.txt','t','test€',function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('existing file should be cached with tag',function(){
        var result = platform.io.cache.is('/tmp/doexist.txt','t');
        result.should.equal(true);
      });

      it('existing file should have been cached with tag',function(){
        var result = platform.io.cache.was('/tmp/doexist.txt','t');
        result.should.equal(true);
      });

      it('get cache data as string for existing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.get.string('/tmp/doexist.txt','t',true,function(err,result){
          result.should.equal('test€');
          done();
        });
      });

      it('existing file should not be cached after change with tag',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test$');
          var result = platform.io.cache.is('/tmp/doexist.txt','t');
          result.should.equal(false);
          done();
        },1000);
      });

      it('existing file should have been cached with tag',function(done){
        setTimeout(function(){
          platform.io.set.string('/tmp/doexist.txt','test€');
          var result = platform.io.cache.was('/tmp/doexist.txt','t');
          result.should.equal(true);
          done();
        },1000);
      });

      it('got cache data as string for existing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.got.string('/tmp/doexist.txt','t',true,function(err,result){
          result.should.equal('test€');
          done();
        });
      });

      it('got cache data as bytes for existing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.got.bytes('/tmp/doexist.txt','t',true,function(err,result){
          result.toString('utf8').should.equal('test€');
          done();
        });
      });

      it('got cache data read stream for existing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.got.stream('/tmp/doexist.txt','t',true,function(err,rstream){
          rstream.on('error', function (err) {
            done(err);
          });
          var rbuffer = new Buffer(0);
          rstream.on('data',function(chunk){
            rbuffer = Buffer.concat([rbuffer,chunk]);
          });
          rstream.on('end',function(){
            if (rbuffer.toString() === 'test€') {
              done();
            }
          });
        });
      });

      it('set cache data as bytes for existing file should succeed with tag', function (done) {
        platform.io.cache.set.bytes('/tmp/doexist.txt','t',new Buffer('test€','ucs2'),function(err,result){
          if (!err) {
            done();
          }
        });
      });

      it('get cache data as bytes for existing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.get.bytes('/tmp/doexist.txt','t',true,function(err,result){
          result.toString('ucs2').should.equal('test€');
          done();
        });
      });

      it('get cache data write stream for existing file should succeed and content should be successfully written with tag', function (done) {
        platform.io.cache.set.stream('/tmp/doexist.txt','t',function(err,wstream){
          wstream.on('error', function (err) {
            done(err);
          });
          wstream.write('test€');
          wstream.flush();
          done();
        });
      });

      it('get cache data read stream for existing file should succeed and content should be correct with tag', function (done) {
        platform.io.cache.get.stream('/tmp/doexist.txt','t',true,function(err,rstream){
          rstream.on('error', function (err) {
            done(err);
          });
          var rbuffer = new Buffer(0);
          rstream.on('data',function(chunk){
            rbuffer = Buffer.concat([rbuffer,chunk]);
          });
          rstream.on('end',function(){
            if (rbuffer.toString() === 'test€') {
              done();
            }
          });
        });
      });

      it('unset for existing file should succeed with tag',function(){
        var result = platform.io.cache.unset('/tmp/doexist.txt','t');
        result.should.equal(true);
        result = platform.io.cache.unset('/tmp/doexist.txt','t');
        result.should.equal(false);
        result = platform.io.cache.is('/tmp/doexist.txt','t');
        result.should.equal(false);
      });

      it('clean should succeed', function () {
        platform.io.cache.clean();
        var result = platform.io.cache._backend.list('/',true);
        result.should.deep.equal([]);
      });

      after(function(){
        platform.io.delete('/tmp/doexist.txt');
      });

    });

  });

});
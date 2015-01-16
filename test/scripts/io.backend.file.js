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

describe('io', function() {

  describe('backend', function () {

    var backend;

    describe('file', function () {

      before(function(){
        native.fs.removeSync(platform.runtime.path.app + '/tmp/test');
      });

      it('should be registered as core.io.store.file', function () {
        platform.classes.exist('core.io.store.file').should.equal(true);
      });

      it('should be instanced successfully while creating base path', function () {
        var result;
        result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test');
        result.should.equal(false);
        backend = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/test']);
        should.exist(backend);
        result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test');
        result.should.equal(true);
      });

      it('instance should have correct base path', function () {
        backend.base.should.equal(platform.runtime.path.app + '/tmp/test');
      });

      it('instance should have no name', function () {
        var result = backend.name === null;
        result.should.equal(true);
      });

      describe('sync', function () {

        before(function(){
          backend.delete('/');
          backend.create('/');
        });

        it('check for missing file should succeed', function () {
          var result = backend.exist('file.txt');
          result.should.equal(false);
        });

        it('check for missing directory should succeed', function () {
          var result = backend.exist('dir');
          result.should.equal(false);
        });

        it('get info for missing file should fail', function () {
          (function(){
            backend.info('file.txt');
          }).should.throw();
        });

        it('get data as string for missing file should fail', function () {
          (function(){
            backend.get.string('file.txt');
          }).should.throw();
        });

        it('get data as bytes for missing file should fail', function () {
          (function(){
            backend.get.bytes('file.txt');
          }).should.throw();
        });

        it('get data read stream for missing file should fail', function (done) {
          backend.get.stream('file.txt').on('error', function (err) {
            if (err) {
              done();
            }
          });
        });

        it('rename missing file should fail', function () {
          (function(){
            backend.rename('file.txt', 'file.ren.txt');
          }).should.throw();
        });

        it('list missing directory should fail', function () {
          (function(){
            backend.list('/dir');
          }).should.throw();
        });

        it('create file should succeed', function () {
          (function(){
            backend.create('file.txt');
          }).should.not.throw();
        });

        it('previous file should be successfully created as a file', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/file.txt');
          result.should.equal(true);
          result = backend.info('file.txt').isDirectory();
          result.should.equal(false);
        });

        it('rename created file should succeed', function () {
          (function(){
            backend.rename('file.txt', 'filenew.txt');
          }).should.not.throw();
        });

        it('file should be successfully renamed', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/file.txt');
          result.should.equal(false);
          result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/filenew.txt');
          result.should.equal(true);
        });

        it('delete file should succeed', function () {
          (function(){
            backend.delete('filenew.txt');
          }).should.not.throw();
        });

        it('previous file should be successfully deleted', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/filenew.txt');
          result.should.equal(false);
          result = backend.exist('filenew.txt');
          result.should.equal(false);
        });

        it('create directory should succeed', function () {
          (function(){
            backend.create('dir/');
          }).should.not.throw();
        });

        it('previous directory should be successfully created as a directory', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dir');
          result.should.equal(true);
          result = backend.info('dir').isDirectory();
          result.should.equal(true);
        });

        it('rename created directory should succeed', function () {
          (function(){
            backend.rename('dir', 'dirnew');
          }).should.not.throw();
        });

        it('directory should be successfully renamed', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dir');
          result.should.equal(false);
          result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dirnew');
          result.should.equal(true);
        });

        it('delete directory should succeed', function () {
          (function(){
            backend.delete('dirnew');
          }).should.not.throw();
        });

        it('previous directory should be successfully deleted', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dirnew');
          result.should.equal(false);
          result = backend.exist('dirnew');
          result.should.equal(false);
        });

        it('set data as string to file should succeed', function () {
          (function(){
            backend.set.string('/dir/file.string.txt', 'test€');
          }).should.not.throw();
        });

        it('get info for previous file should succeed and size should be correct', function () {
          var result = backend.info('/dir/file.string.txt').size;
          result.should.equal(7);
        });

        it('get data as string from file should succeed and content should be correct', function () {
          var result = backend.get.string('/dir/file.string.txt');
          result.should.equal('test€');
        });

        it('set data as bytes to file should succeed', function () {
          (function(){
            backend.set.bytes('/dir/file.bytes.txt', new Buffer('test€', 'ucs2'));
          }).should.not.throw();
        });

        it('get info for previous file should succeed and size should be correct', function () {
          var result = backend.info('/dir/file.bytes.txt').size;
          result.should.equal(10);
        });

        it('get data as bytes from file should succeed and content should be correct', function () {
          var result = backend.get.bytes('/dir/file.bytes.txt');
          result.toString('ucs2').should.equal('test€');
        });

        it('get data write stream for file should succeed and content should be successfully written', function (done) {

          var wstream = backend.set.stream('/dir/file.stream.txt');
          wstream.on('open', function () {
            wstream.write('test€');
            wstream.end();
            if (backend.info('/dir/file.stream.txt').size === 7) {
              done();
            }
          });
          wstream.on('error', function (err) {
            done(err);
          });
        });

        it('get data read stream for file should succeed and content should be correct', function (done) {
          var rstream = backend.get.stream('/dir/file.stream.txt');
          rstream.on('readable', function () {
            var rbuffer = rstream.read();
            rstream.close();
            if (rbuffer != null && rbuffer.toString() === 'test€') {
              done();
            }
          });
          rstream.on('error', function (err) {
            done(err);
          });
        });

        it('list empty directory should succeed with no results', function () {
          var result = backend.list('/');
          result.should.deep.equal([]);
        });

        it('list recursively directory should succeed with correct results', function () {
          var result = backend.list('/', null, true);
          result.should.deep.equal(["dir/file.bytes.txt", "dir/file.stream.txt", "dir/file.string.txt"]);
        });

        it('list directory should succeed with correct results', function () {
          var result = backend.list('/dir');
          result.should.deep.equal(["file.bytes.txt", "file.stream.txt", "file.string.txt"]);
        });

        it('list directory with single filter should succeed with correct results', function () {
          var result = backend.list('/dir', null, true, 'file.s*.txt');
          result.should.deep.equal(["file.stream.txt", "file.string.txt"]);
        });

        it('list directory with multiple filters should succeed with correct results', function () {
          var result = backend.list('/dir', null, true, ['file.stream.*', 'file.string.*']);
          result.should.deep.equal(["file.stream.txt", "file.string.txt"]);
        });

        after(function () {
          backend.delete('/');
        });

      });

      describe('async', function () {

        before(function(){
          backend.delete('/');
          backend.create('/');
        });

        it('check for missing file should succeed', function (done) {
          backend.exist('file.txt',function(result){
            result.should.equal(false);
            done();
          });
        });

        it('check for missing directory should succeed', function (done) {
          backend.exist('dir',function(result){
            result.should.equal(false);
            done();
          });
        });

        it('info for missing file should fail', function (done) {
          backend.info('file.txt',function(err,result){
            if (err) {
              done();
            }
          });
        });

        it('get data as string for missing file should fail', function (done) {
          backend.get.string('file.txt',function(err,result){
            if (err) {
              done();
            }
          });
        });

        it('get data as bytes for missing file should fail', function (done) {
          backend.get.bytes('file.txt',function(err,result){
            if (err) {
              done();
            }
          });
        });

        it('get data read stream for missing file should fail', function (done) {
          backend.get.stream('file.txt',null ,function (err, result) {
            if (err) {
              done();
            }
          });
        });

        it('rename missing file should fail', function (done) {
          backend.rename('file.txt', 'file.ren.txt',function(err,result){
            if (err) {
              done();
            }
          });
        });

        it('list missing directory should fail', function (done) {
          backend.list('/dir',null,null,null,function(err,result){
            if (err) {
              done();
            }
          });
        });

        it('create file should succeed', function (done) {
          backend.create('file.txt',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('previous file should be successfully created as a file', function (done) {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/file.txt');
          result.should.equal(true);
          backend.info('file.txt',function(err,stats){
            var result = stats.isDirectory();
            result.should.equal(false);
            done();
          });
        });

        it('rename created file should succeed', function (done) {
          backend.rename('file.txt', 'filenew.txt',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('file should be successfully renamed', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/file.txt');
          result.should.equal(false);
          result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/filenew.txt');
          result.should.equal(true);
        });

        it('delete file should succeed', function (done) {
          backend.delete('filenew.txt',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('previous file should be successfully deleted', function (done) {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/filenew.txt');
          result.should.equal(false);
          backend.exist('filenew.txt',function(result){
            result.should.equal(false);
            done();
          });
        });

        it('create directory should succeed', function (done) {
          backend.create('dir/',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('previous directory should be successfully created as a directory', function (done) {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dir');
          result.should.equal(true);
          backend.info('dir',function(err,stats){
            var result = stats.isDirectory();
            result.should.equal(true);
            done();
          });
        });

        it('rename created directory should succeed', function (done) {
          backend.rename('dir', 'dirnew',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('directory should be successfully renamed', function () {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dir');
          result.should.equal(false);
          result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dirnew');
          result.should.equal(true);
        });

        it('delete directory should succeed', function (done) {
          backend.delete('dirnew',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('previous directory should be successfully deleted', function (done) {
          var result = native.fs.existsSync(platform.runtime.path.app + '/tmp/test/dirnew');
          result.should.equal(false);
          backend.exist('dirnew',function(result){
            result.should.equal(false);
            done();
          });
        });

        it('set data as string to file should succeed', function (done) {
          backend.set.string('/dir/file.string.txt', 'test€',function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('get info for previous file should succeed and size should be correct', function (done) {
          backend.info('/dir/file.string.txt',function(err,stats){
            var result = stats.size;
            result.should.equal(7);
            done();
          });
        });

        it('get data as string from file should succeed and content should be correct', function (done) {
          backend.get.string('/dir/file.string.txt',function(err,result){
            result.should.equal('test€');
            done();
          });
        });

        it('set data as bytes to file should succeed', function (done) {
          backend.set.bytes('/dir/file.bytes.txt', new Buffer('test€', 'ucs2'),function(err,result){
            if (!err) {
              done();
            }
          });
        });

        it('get info for previous file should succeed and size should be correct', function (done) {
          backend.info('/dir/file.bytes.txt',function(err,stats){
            var result = stats.size;
            result.should.equal(10);
            done();
          });
        });

        it('get data as bytes from file should succeed and content should be correct', function (done) {
          backend.get.bytes('/dir/file.bytes.txt',function(err,result){
            result.toString('ucs2').should.equal('test€');
            done();
          });
        });

        it('get data write stream for file should succeed and content should be successfully written', function (done) {
          backend.set.stream('/dir/file.stream.txt',null,function(err,wstream){
            wstream.on('open', function () {
              wstream.write('test€');
              wstream.end();
              if (backend.info('/dir/file.stream.txt').size === 7) {
                done();
              }
            });
            wstream.on('error', function (err) {
              done(err);
            });
          });
        });

        it('get data read stream for file should succeed and content should be correct', function (done) {
          backend.get.stream('/dir/file.stream.txt',null,function(err,rstream){
            rstream.on('readable', function () {
              var rbuffer = rstream.read();
              rstream.close();
              if (rbuffer != null && rbuffer.toString() === 'test€') {
                done();
              }
            });
            rstream.on('error', function (err) {
              done(err);
            });
          });
        });

        it('list empty directory should succeed with no results', function (done) {
          backend.list('/',null,null,null,function(err,result){
            result.should.deep.equal([]);
            done();
          });
        });

        it('list recursively directory should succeed with correct results', function (done) {
          backend.list('/', null, true, null, function(err,result){
            result.should.deep.equal(["dir/file.bytes.txt", "dir/file.stream.txt", "dir/file.string.txt"]);
            done();
          });
        });

        it('list directory should succeed with correct results', function (done) {
          backend.list('/dir', null,null,null, function(err,result){
            result.should.deep.equal(["file.bytes.txt", "file.stream.txt", "file.string.txt"]);
            done();
          });
        });

        it('list directory with single filter should succeed with correct results', function (done) {
          backend.list('/dir', null, true, 'file.s*.txt', function(err,result){
            result.should.deep.equal(["file.stream.txt", "file.string.txt"]);
            done();
          });
        });

        it('list directory with multiple filter should succeed with correct results', function (done) {
          backend.list('/dir', null, true, ['file.stream.*', 'file.string.*'], function(err,result){
            result.should.deep.equal(["file.stream.txt", "file.string.txt"]);
            done();
          });
        });

        after(function () {
          backend.delete('/');
        });

      });

      after(function () {
        backend.delete('/');
      });

    });

  });

});
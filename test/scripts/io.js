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

  var backendA, backendB;

  before(function(){
    backendA = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/testA']);
    backendB = platform.kernel.new('core.io.store.file', [platform.runtime.path.app + '/tmp/testB']);
    platform.io.store.register('testA',backendA,0);
    platform.io.store.register('testB',backendB,1);
  });

  it('namespace should exists', function () {
    should.exist(platform.io);
  });

  it('map should succeed', function () {
    var result = platform.io.map('');
    result.should.equal(platform.runtime.path.app + '/');
    result = platform.io.map('/file.txt');
    result.should.equal(platform.runtime.path.app + '/file.txt');
    result = platform.io.map('/dir/');
    result.should.equal(platform.runtime.path.app + '/dir/');
    result = platform.io.map('/file.txt', platform.runtime.path.core);
    result.should.equal(platform.runtime.path.core + '/file.txt');
    result = platform.io.map('/dir/', platform.runtime.path.core);
    result.should.equal(platform.runtime.path.core + '/dir/');
  });

  describe('sync', function () {

    it('check for missing file should succeed', function () {
      var result = platform.io.exist('file.txt');
      result.should.equal(false);
    });

    it('check for missing directory should succeed', function () {
      var result = platform.io.exist('dir');
      result.should.equal(false);
    });

    it('get info for missing file should fail', function () {
      (function(){
        platform.io.info('file.txt');
      }).should.throw();
    });

    it('get data as string for missing file should fail', function () {
      (function(){
        platform.io.get.string('file.txt');
      }).should.throw();
    });

    it('get data as bytes for missing file should fail', function () {
      (function(){
        platform.io.get.bytes('file.txt');
      }).should.throw();
    });

    it('get data read stream for missing file should fail', function (done) {
      platform.io.get.stream('file.txt').on('error', function (err) {
        if (err) {
          done();
        }
      });
    });

    it('rename missing file should fail', function () {
      (function(){
        platform.io.rename('file.txt', 'file.ren.txt');
      }).should.throw();
    });

    it('list missing directory should fail', function () {
      (function(){
        platform.io.list('/dir');
      }).should.throw();
    });

    it('create file should succeed', function () {
      (function(){
        platform.io.create('file.txt');
      }).should.not.throw();
    });

    it('previous file should be successfully created as a file', function () {
      var result = platform.io.exist('file.txt');
      result.should.equal(true);
      result = platform.io.info('file.txt').isDirectory();
      result.should.equal(false);
    });

    it('rename created file should succeed', function () {
      (function(){
        platform.io.rename('file.txt', 'filenew.txt');
      }).should.not.throw();
    });

    it('file should be successfully renamed', function () {
      var result = platform.io.exist('file.txt');
      result.should.equal(false);
      result = platform.io.exist('filenew.txt');
      result.should.equal(true);
    });

    it('delete file should succeed', function () {
      (function(){
        platform.io.delete('filenew.txt');
      }).should.not.throw();
    });

    it('previous file should be successfully deleted', function () {
      var result = platform.io.exist('filenew.txt');
      result.should.equal(false);
      result = platform.io.exist('filenew.txt');
      result.should.equal(false);
    });

    it('create directory should succeed', function () {
      (function(){
        platform.io.create('dir/');
      }).should.not.throw();
    });

    it('previous directory should be successfully created as a directory', function () {
      var result = platform.io.exist('dir');
      result.should.equal(true);
      result = platform.io.info('dir').isDirectory();
      result.should.equal(true);
    });

    it('rename created directory should succeed', function () {
      (function(){
        platform.io.rename('dir', 'dirnew');
      }).should.not.throw();
    });

    it('directory should be successfully renamed', function () {
      var result = platform.io.exist('dir');
      result.should.equal(false);
      result = platform.io.exist('dirnew');
      result.should.equal(true);
    });

    it('delete directory should succeed', function () {
      (function(){
        platform.io.delete('dirnew');
      }).should.not.throw();
    });

    it('previous directory should be successfully deleted', function () {
      var result = platform.io.exist('dirnew');
      result.should.equal(false);
      result = platform.io.exist('dirnew');
      result.should.equal(false);
    });

    it('set data as string to file should succeed', function () {
      (function(){
        platform.io.set.string('/dir/file.string.txt', 'test€');
      }).should.not.throw();
    });

    it('get info for previous file should succeed and size should be correct', function () {
      var result = platform.io.info('/dir/file.string.txt').size;
      result.should.equal(7);
    });

    it('get data as string from file should succeed and content should be correct', function () {
      var result = platform.io.get.string('/dir/file.string.txt');
      result.should.equal('test€');
    });

    it('set data as bytes to file should succeed', function () {
      (function(){
        platform.io.set.bytes('/dir/file.bytes.txt', new Buffer('test€', 'ucs2'));
      }).should.not.throw();
    });

    it('get info for previous file should succeed and size should be correct', function () {
      var result = platform.io.info('/dir/file.bytes.txt').size;
      result.should.equal(10);
    });

    it('get data as bytes from file should succeed and content should be correct', function () {
      var result = platform.io.get.bytes('/dir/file.bytes.txt');
      result.toString('ucs2').should.equal('test€');
    });

    it('get data write stream for file should succeed and content should be successfully written', function (done) {
      var wstream = platform.io.set.stream('/dir/file.stream.txt');
      wstream.on('open', function () {
        wstream.write('test€');
        wstream.end();
        if (platform.io.info('/dir/file.stream.txt').size === 7) {
          done();
        }
      });
      wstream.on('error', function (err) {
        done(err);
      });
    });

    it('get data read stream for file should succeed and content should be correct', function (done) {
      var rstream = platform.io.get.stream('/dir/file.stream.txt');
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
      var result = platform.io.list('/');
      result.should.deep.equal([]);
    });

    it('list recursively directory should succeed with correct results', function () {
      var result = platform.io.list('/', true);
      result.should.deep.equal(["dir/file.bytes.txt", "dir/file.stream.txt", "dir/file.string.txt"]);
    });

    it('list directory should succeed with correct results', function () {
      var result = platform.io.list('/dir');
      result.should.deep.equal(["file.bytes.txt", "file.stream.txt", "file.string.txt"]);
    });

    it('list directory with single filter should succeed with correct results', function () {
      var result = platform.io.list('/dir', true, 'file.s*.txt');
      result.should.deep.equal(["file.stream.txt", "file.string.txt"]);
    });

    it('list directory with multiple filters should succeed with correct results', function () {
      var result = platform.io.list('/dir', true, ['file.stream.*', 'file.string.*']);
      result.should.deep.equal(["file.stream.txt", "file.string.txt"]);
    });

    describe('overlay',function(){

      it('resolve should succeed for file', function(){
        backendB.create('fileB.txt');
        var result = platform.io.resolve('fileB.txt');
        result.should.equal(platform.runtime.path.app + '/tmp/testB/fileB.txt');
        backendA.create('fileB.txt');
        result = platform.io.resolve('fileB.txt');
        result.should.equal(platform.runtime.path.app + '/tmp/testA/fileB.txt');
      });

      it('resolve should succeed for directory', function(){
        backendB.create('dirB/');
        var result = platform.io.resolve('dirB');
        result.should.equal(platform.runtime.path.app + '/tmp/testB/dirB');
        backendA.create('dirB/');
        result = platform.io.resolve('dirB');
        result.should.equal(platform.runtime.path.app + '/tmp/testA/dirB');
      });

      it('resolve should succeed for missing file', function(){
        var result = platform.io.resolve('dirC');
        should.not.exist(result);
      });

      it('get data as string from file should succeed and content should be correct', function () {
        backendA.set.string('/dir/file.string.txt','test€');
        backendB.set.string('/dir/file.string.txt','test$');
        var result = platform.io.get.string('/dir/file.string.txt');
        result.should.equal('test€');
        platform.io.store.setPriority('testB',0);
        result = platform.io.get.string('/dir/file.string.txt');
        result.should.equal('test$');
        platform.io.store.setPriority('testA',0);
        result = platform.io.get.string('/dir/file.string.txt');
        result.should.equal('test€');
      });

      it('get data as bytes from file should succeed and content should be correct', function () {
        backendA.set.bytes('/dir/file.bytes.txt', new Buffer('test€','ucs2'));
        backendB.set.bytes('/dir/file.bytes.txt', new Buffer('test$','ucs2'));
        var result = platform.io.get.bytes('/dir/file.bytes.txt');
        result.toString('ucs2').should.equal('test€');
        platform.io.store.setPriority('testB',0);
        result = platform.io.get.bytes('/dir/file.bytes.txt');
        result.toString('ucs2').should.equal('test$');
        platform.io.store.setPriority('testA',0);
        result = platform.io.get.bytes('/dir/file.bytes.txt');
        result.toString('ucs2').should.equal('test€');
      });

      /*it('get data read stream for file should succeed and content should be correct', function (done) {
        //T: add overlay get stream test
      });*/

      it('resolveAll should succeed', function () {
        var result = platform.io.resolveAll('/dir/file.bytes.txt');
        Object.keys(result).should.deep.equal([ 'testA', 'testB' ]);
        result['testA'].should.equal(platform.runtime.path.app + '/tmp/testA/dir/file.bytes.txt');
        result['testB'].should.equal(platform.runtime.path.app + '/tmp/testB/dir/file.bytes.txt');
      });

      it('listAll should succeed', function () {
        var result = platform.io.listAll('/dir',true);
        result.should.deep.equal({
          'testA': [ 'file.bytes.txt', 'file.stream.txt', 'file.string.txt' ],
          'testB': [ 'file.bytes.txt', 'file.string.txt' ]
        });
      });

    });

  });

  after(function(){
    platform.io.store.unregister('testA');
    platform.io.store.unregister('testB');
    platform.io.delete('/tmp/testA');
    platform.io.delete('/tmp/testB');
  });

});
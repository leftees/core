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

platform.io.cache = platform.io.cache || {};

platform.io.cache.clean = function(){
  var backend = platform.io.cache.__backend__;
  backend.delete('/');
  backend.create('/');
};

platform.io.cache.is = function(path, tag){
  var backend = platform.io.cache.__backend__;
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  return backend.exist(path + cachetag + '.' + cachetime);
};

platform.io.cache.was = function(path, tag){
  var backend = platform.io.cache.__backend__;
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);
  return (backend.list(filepath, false, filename + cachetag + '.*').length > 0);
};

platform.io.cache.get = {};

platform.io.cache.get.string = function(path, tag, decompress, callback){
  if (typeof callback !== 'function') {
    throw new Exception('callback is required');
  }

  var backend = platform.io.cache.__backend__;

  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  var buffer = backend.get.bytes(path + cachetag + '.' + cachetime);

  if (decompress === true) {
    native.zlib.gunzip(buffer, function (err, result) {
      callback(result.toString('utf8'));
    });
  } else {
    callback(buffer.toString('utf8'));
  }
};

platform.io.cache.get.bytes = function(path, tag, decompress, callback){
  if (typeof callback !== 'function') {
    throw new Exception('callback is required');
  }

  var backend = platform.io.cache.__backend__;

  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  var buffer = backend.get.bytes(path + cachetag + '.' + cachetime);

  if (decompress === true) {
    native.zlib.gunzip(buffer, function (err, result) {
      callback(result);
    });
  } else {
    callback(buffer);
  }
};

platform.io.cache.get.stream = function(path, tag, decompress, callback){
  if (typeof callback !== 'function') {
    throw new Exception('callback is required');
  }

  var backend = platform.io.cache.__backend__;

  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  var stream = backend.get.stream(path + cachetag + '.' + cachetime);

  if (decompress === true) {
    callback(stream.pipe(native.zlib.createGunzip()));
  } else {
    callback(stream);
  }
};

platform.io.cache.got = function(path, tag, decompress){
  var backend = platform.io.cache.__backend__;

};

platform.io.cache.set = {};

platform.io.cache.set.string = function(path, tag, data, callback){
  if (typeof callback !== 'function') {
    throw new Exception('callback is required');
  }

  var backend = platform.io.cache.__backend__;

  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  var buffer = new Buffer(data, 'utf8');
  native.zlib.gzip(buffer,function(err,result){
    callback(backend.set.bytes(path + cachetag + '.' + cachetime, result));
  });
};

platform.io.cache.set.bytes = function(path, tag, data, callback){
  if (typeof callback !== 'function') {
    throw new Exception('callback is required');
  }

  var backend = platform.io.cache.__backend__;

  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  native.zlib.gzip(data,function(err,result){
    callback(backend.set.bytes(path + cachetag + '.' + cachetime, result));
  });
};

platform.io.cache.set.stream = function(path, tag, callback){
  if (typeof callback !== 'function') {
    throw new Exception('callback is required');
  }

  var backend = platform.io.cache.__backend__;

  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  var stream = native.zlib.createGzip();
  stream.pipe(backend.set.stream(path + cachetag + '.' + cachetime));
  callback (stream);
};

platform.io.cache.unset = function(path, tag){
  var backend = platform.io.cache.__backend__;
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  if (backend.exist(filepath) === false) {
    return false;
  }

  var result = backend.list(filepath, false, filename + cachetag + '.*');
  result.forEach(function(file){
    backend.delete(filepath + native.path.sep + file);
  });
  return (result.length > 0);
};

platform.io.store.register('cache',platform.kernel.new('core.io.store.file',[ native.path.join(platform.runtime.path.app,'cache') ]),-1);

platform.io.cache.__backend__ = platform.io.store.getByName('cache');
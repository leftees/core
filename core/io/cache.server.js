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

//N: Provides IO helper with abstract filesystem and packaged module support.
platform.io = platform.io || {};

//N: Provides managed cache IO support.
platform.io.cache = platform.io.cache || {};

//F: Clean the whole cache.
platform.io.cache.clean = function(){
  //C: deleting and recreating root in cache IO backend
  platform.io.cache._backend.delete('/');
  platform.io.cache._backend.create('/');

  if (global.development === true) {
    platform.io.cache._backend_raw.delete('/');
    platform.io.cache._backend_raw.create('/');
  }
};

//F: Checks whether the latest version of a file is cached.
//A: path: Specifies the target file path.
//A: [tag]: Specifies a custom tag for different cache variants.
//R: Returns true if the latest version of the file is cached.
platform.io.cache.is = function(path, tag){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: checking for latest cached version of the file
  return backend.exist(path + cachetag + '.' + cachetime);
};

//F: Checks whether any version of a file is cached (maybe not the latest one).
//A: path: Specifies the target file path.
//A: [tag]: Specifies a custom tag for different cache variants.
//R: Returns true if any version of the file.
platform.io.cache.was = function(path, tag){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  //C: checking whether parent folder exists
  if (backend.exist(filepath) === false) {
    return false;
  }

  //C: searching cached versions of the file
  return (backend.list(filepath, false, filename + cachetag + '.*').length > 0);
};

//O: Provides get implementations.
platform.io.cache.get = {};

//F: Gets latest cached data, as string, for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [decompress]: Specifies whether decompress the cached data. Default is false.
//A: [callback(err,data)]: Callback for async support.
platform.io.cache.get.string = function(path, tag, decompress, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: getting file name and path
  var filepath = native.path.dirname(path);

  var error = null;

  //C: checking whether parent folder exists
  if (backend.exist(path + cachetag + '.' + cachetime) === false) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(path + cachetag + '.' + cachetime)).toString('utf8');
    } else {
      return backend.get.bytes(path + cachetag + '.' + cachetime).toString('utf8');
    }
  } else {
    //C: getting bytes from cache
    backend.get.bytes(path + cachetag + '.' + cachetime, function (err, buffer) {
      if (err) {
        callback(err);
      } else {
        //C: decompressing data if requested and invoking callback with result
        if (decompress !== false) {
          native.zlib.gunzip(buffer, function (err, result) {
            callback(null, result.toString('utf8'));
          });
        } else {
          callback(null, buffer.toString('utf8'));
        }
      }
    });
  }
};

//F: Gets latest cached data, as bytes (Buffer), for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [decompress]: Specifies whether decompress the cached data. Default is false.
//A: [callback(err,data)]: Callback for async support.
platform.io.cache.get.bytes = function(path, tag, decompress, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: getting file name and path
  var filepath = native.path.dirname(path);

  var error = null;

  //C: checking whether parent folder exists
  if (backend.exist(path + cachetag + '.' + cachetime) === false) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(path + cachetag + '.' + cachetime));
    } else {
      return backend.get.bytes(path + cachetag + '.' + cachetime);
    }
  } else {
    //C: getting bytes from cache
    backend.get.bytes(path + cachetag + '.' + cachetime, function (err, buffer) {
      if (err) {
        callback(err);
      } else {
        //C: decompressing data if requested and invoking callback with result
        if (decompress !== false) {
          native.zlib.gunzip(buffer, function (err, result) {
            callback(null, result);
          });
        } else {
          callback(null, buffer);
        }
      }
    });
  }
};

//F: Gets read stream from latest cached data for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [decompress]: Specifies whether decompress the cached data. Default is false.
//A: [callback(err,stream)]: Callback for async support.
platform.io.cache.get.stream = function(path, tag, decompress, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: getting file name and path
  var filepath = native.path.dirname(path);

  var error = null;

  //C: checking whether parent folder exists
  if (backend.exist(path + cachetag + '.' + cachetime) === false) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return backend.get.stream(path + cachetag + '.' + cachetime).pipe(native.zlib.createGunzip());
    } else {
      return backend.get.stream(path + cachetag + '.' + cachetime);
    }
  } else {
    //C: getting stream from cache
    backend.get.stream(path + cachetag + '.' + cachetime, null, function (err, streamBase) {
      if (err) {
        callback(err);
      } else {
        //C: decompressing data if requested and invoking callback with result
        if (decompress !== false) {
          var stream = streamBase.pipe(native.zlib.createGunzip());
          callback(null, stream);
        }
        else {
          callback(null, streamBase);
        }
      }
    });
  }
};

//O: Provides got implementations.
platform.io.cache.got = {};

//F: Gets previously cached data, as string, for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [decompress]: Specifies whether decompress the cached data. Default is false.
//A: [callback(err,data)]: Callback for async support.
platform.io.cache.got.string = function(path, tag, decompress, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  var error = null;

  //C: checking whether parent folder exists
  if (backend.exist(filepath) === false) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }

  //C: searching for any cached version of the file
  var candidates = backend.list(filepath, false, filename + cachetag + '.*');
  //C: checking whether there is no cached version of the file
  if (candidates.length === 0) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }
  //C: taking the first found (assuming only one version will be available)
  var candidate = candidates[0];

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(filepath + native.path.sep + candidate)).toString('utf8');
    } else {
      return backend.get.bytes(filepath + native.path.sep + candidate).toString('utf8');
    }
  } else {
    //C: getting bytes from cache
    backend.get.bytes(filepath + native.path.sep + candidate, function (err, buffer) {
      if (err) {
        callback(err);
      } else {
        //C: decompressing data if requested and invoking callback with result
        if (decompress !== false) {
          native.zlib.gunzip(buffer, function (err, result) {
            callback(null, result.toString('utf8'));
          });
        } else {
          callback(null, buffer.toString('utf8'));
        }
      }
    });
  }
};

//F: Gets previously cached data, as bytes (Buffer), for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [decompress]: Specifies whether decompress the cached data. Default is false.
//A: [callback(err,data)]: Callback for async support.
platform.io.cache.got.bytes = function(path, tag, decompress, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  var error = null;

  //C: checking whether parent folder exists
  if (backend.exist(filepath) === false) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }

  //C: searching for any cached version of the file
  var candidates = backend.list(filepath, false, filename + cachetag + '.*');
  //C: checking whether there is no cached version of the file
  if (candidates.length === 0) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }
  //C: taking the first found (assuming only one version will be available)
  var candidate = candidates[0];

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(filepath + native.path.sep + candidate));
    } else {
      return backend.get.bytes(filepath + native.path.sep + candidate);
    }
  } else {
    //C: getting bytes from cache
    backend.get.bytes(filepath + native.path.sep + candidate, function (err, buffer) {
      if (err) {
        callback(err);
      } else {
        //C: decompressing data if requested and invoking callback with result
        if (decompress !== false) {
          native.zlib.gunzip(buffer, function (err, result) {
            callback(null, result);
          });
        } else {
          callback(null, buffer);
        }
      }
    });
  }
};

//F: Gets read stream from previously cached data for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [decompress]: Specifies whether decompress the cached data. Default is false.
//A: [callback(err,stream)]: Callback for async support.
platform.io.cache.got.stream = function(path, tag, decompress, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  var error = null;

  //C: checking whether parent folder exists
  if (backend.exist(filepath) === false) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }

  //C: searching for any cached version of the file
  var candidates = backend.list(filepath, false, filename + cachetag + '.*');
  //C: checking whether there is no cached version of the file
  if (candidates.length === 0) {
    error = new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    if (typeof callback !== 'function') {
      throw error;
    } else {
      callback(error);
      return;
    }
  }
  //C: taking the first found (assuming only one version will be available)
  var candidate = candidates[0];

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return backend.get.stream(filepath + native.path.sep + candidate).pipe(native.zlib.createGunzip());
    } else {
      return backend.get.stream(filepath + native.path.sep + candidate);
    }
  } else {
    //C: getting stream from cache
    backend.get.stream(filepath + native.path.sep + candidate, null, function (err, streamBase) {
      if (err) {
        callback(err);
      } else {
        //C: decompressing data if requested and invoking callback with result
        if (decompress !== false) {
          var stream = streamBase.pipe(native.zlib.createGunzip());
          callback(null, stream);
        } else {
          callback(null, streamBase);
        }
      }
    });
  }
};

//O: Provides set implementations.
platform.io.cache.set = {};

//F: Sets latest cached data, as string, for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: data: Specifies the data to be cached.
//A: callback(err): Callback for async support.
platform.io.cache.set.string = function(path, tag, data, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: removing previous cached data
  if (platform.io.cache.unset(path, tag) === false) {
    if(platform.configuration.server.debugging.cache === true) {
      console.debug('caching %s', path);
    }
  } else {
    if(platform.configuration.server.debugging.cache === true) {
      console.debug('recaching %s', path);
    }
  }

  if (global.testing === true || global.development === true) {
    platform.io.cache._backend_raw.set.string(path, data);
  }

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: compressing data and writing to cache
    backend.set.bytes(path + cachetag + '.' + cachetime, native.zlib.gzipSync(data));
  } else {
    //C: compressing bytes to cache
    native.zlib.gzip(new Buffer(data, 'utf8'), function (err, result) {
      if (err) {
        callback(err);
      } else {
        backend.set.bytes(path + cachetag + '.' + cachetime, result, callback);
      }
    });
  }
};

//F: Sets latest cached data, as bytes (Buffer), for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: data: Specifies the data to be cached.
//A: callback(err): Callback for async support.
platform.io.cache.set.bytes = function(path, tag, data, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: removing previous cached data
  if (platform.io.cache.unset(path, tag) === false) {
    if(platform.configuration.server.debugging.cache === true) {
      console.debug('caching %s', path);
    }
  } else {
    if(platform.configuration.server.debugging.cache === true) {
      console.debug('recaching %s', path);
    }
  }

  if (global.development === true) {
    platform.io.cache._backend_raw.set.bytes(path, data);
  }

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: compressing data and writing to cache
    backend.set.bytes(path + cachetag + '.' + cachetime, native.zlib.gzipSync(data));
  } else {
    //C: compressing bytes to cache
    native.zlib.gzip(data, function (err, result) {
      if (err) {
        callback(err);
      } else {
        backend.set.bytes(path + cachetag + '.' + cachetime, result, callback);
      }
    });
  }
};

//F: Gets write stream to latest cached data for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: callback(err,stream): Callback for async support.
platform.io.cache.set.stream = function(path, tag, callback){
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting ticks from mtime as cache version
  var cachetime = null;
  try {
    cachetime = platform.io.info(path).mtime.getTime();
  } catch(err) {
    cachetime = 0;
  }

  //C: removing previous cached data
  if (platform.io.cache.unset(path, tag) === false) {
    if(platform.configuration.server.debugging.cache === true) {
      console.debug('caching %s', path);
    }
  } else {
    if(platform.configuration.server.debugging.cache === true) {
      console.debug('recaching %s', path);
    }
  }

  //C: creating gzipped stream for cache
  var stream = native.zlib.createGzip();
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    var streamBase = backend.set.stream(path + cachetag + '.' + cachetime);
    stream.pipe(streamBase);
    streamBase.on('open',function(){stream.emit('open');});
    return stream;
  } else {
    //C: creating stream in cache
    backend.set.stream(path + cachetag + '.' + cachetime, null, function (err, streamBase) {
      if (err) {
        callback(err);
      } else {
        stream.pipe(streamBase);
        callback(null, stream);
      }
    });
  }
};

//F: Removes all cached versions of a file.
//A: path: Specifies the target file path.
//A: [tag]: Specifies a custom tag for different cache variants.
//R: Returns true if any cached versions has been deleted.
platform.io.cache.unset = function(path, tag) {
  //C: get cache backend
  var backend = platform.io.cache._backend;

  //C: preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  //C: getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  //C: skipping search if file path doesn't exist
  if (backend.exist(filepath) === false) {
    return false;
  }

  //C: deleting all cached versions of a file
  var result = backend.list(filepath, false, filename + cachetag + '.*');
  if (result.length === 0) {
    return false;
  } else {
    result.forEach(function (file) {
      backend.delete(filepath + native.path.sep + file);
    });
    return true;
  }
};

//C: registering 'cache' store as new filesystem backend with app root path + /cache/
//T: allow cache store override by configuration
platform.io.store.register('cache',platform.kernel.new('core.io.store.file',[ native.path.join(platform.runtime.path.app,'cache') ]),-1);

//V: Stores the 'cache' store backend.
platform.io.cache._backend = platform.io.store.getByName('cache');

if (global.development === true) {
  //C: registering 'cache.raw' store as new filesystem backend with app root path + /cache.raw/
  //T: allow build store override by configuration
  platform.io.store.register('cache.raw', platform.kernel.new('core.io.store.file', [ native.path.join(platform.runtime.path.app, 'cache.raw') ]), -1);

  //V: Stores the 'cache.raw' store backend.
  platform.io.cache._backend_raw = platform.io.store.getByName('cache.raw');
}

if (platform.configuration.server.cache.startup.clean === true){
  platform.io.cache.clean();
}
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2015 Marco Minetti <marco.minetti@novetica.org>

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

/**
 * Provides IO helper with abstract filesystem and packaged module support.
 * @namespace
*/
platform.io = platform.io || {};

/**
 * Provides managed cache IO support.
 * @namespace
*/
platform.io.cache = platform.io.cache || {};

/**
 * Clean the whole cache.
 * @param {} [callback(err)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.clean = function(callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // deleting root in cache IO backend
  platform.io.backends.cache.delete('/',function(err){
    if (err) {
      callback.reject(err);
    } else {
      // creating root in cache IO backend
      platform.io.backends.cache.create('/',function(err){
        if(err){
          callback.reject(err);
        } else {
          callback.resolve();
        }
      });
    }
  });

  return callback.promise;
};

/**
 * Clean the whole cache.
*/
platform.io.cache.cleanSync = function(){
  // deleting and recreating root in cache IO backend
  platform.io.backends.cache.deleteSync('/');
  platform.io.backends.cache.createSync('/');
};

/**
 * Checks whether the latest version of a file is cached.
 * @param {} path Specifies the target file path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [callback(err,result)] Callback for node async pattern or null to get a Promise (to support await).
 * @return {} Returns true if the latest version of the file is cached.
*/
platform.io.cache.isCached = function(path, tag, callback){

  // normalizing arguments
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        backend.exists(path + cachetag + '.' + cachetime,function(exists){
          callback.resolve(exists);
        });
      });
    }
  });

  return callback.promise;

};

/**
 * Checks whether the latest version of a file is cached.
 * @param {} path Specifies the target file path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @return {} Returns true if the latest version of the file is cached.
*/
platform.io.cache.isCachedSync = function(path, tag){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // checking for latest cached version of the file
  return backend.existsSync(path + cachetag + '.' + cachetime);
};

/**
 * Checks whether any version of a file is cached (maybe not the latest one).
 * @param {} path Specifies the target file path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [callback(err,result)] Callback for node async pattern or null to get a Promise (to support await).
 * @return {} Returns true if any version of the file.
*/
platform.io.cache.wasCached = function(path, tag, callback){

  // normalizing arguments
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether file exists
  backend.exists(filepath,function(exists){
    if (exists === false) {
      callback.resolve(false);
    } else {
      // searching cached versions of the file
      backend.list(filepath, null, false, filename + cachetag + '.*',function(err,files){
        if (err) {
          callback.reject(err);
        } else {
          callback.resolve((files.length > 0));
        }
      });
    }
  });

  return callback.promise;
};

/**
 * Checks whether any version of a file is cached (maybe not the latest one).
 * @param {} path Specifies the target file path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @return {} Returns true if any version of the file.
*/
platform.io.cache.wasCachedSync = function(path, tag){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether file exists
  if (backend.existsSync(filepath) === false) {
    return false;
  }

  // searching cached versions of the file
  return (backend.listSync(filepath, null, false, filename + cachetag + '.*').length > 0);
};

/**
 * Provides get implementations.
 * @type {Object}
*/
platform.io.cache.get = platform.io.cache.get || {};

/**
 * Gets latest cached data, as string, for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
 * @param {} [callback(err,data)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.get.string = function(path, tag, decompress, callback){

  // normalizing arguments
  if (callback == null && typeof decompress === 'function'){
    callback = decompress;
    decompress = null;
  }
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        // checking whether parent folder exists
        backend.exists(path + cachetag + '.' + cachetime,function(exists){
          if(exists === false){
            callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
          } else {
            // getting bytes from cache
            backend.get.bytes(path + cachetag + '.' + cachetime, function (err, buffer) {
              if (err) {
                callback.reject(err);
              } else {
                // decompressing data if requested and invoking callback with result
                if (decompress !== false) {
                  native.zlib.gunzip(buffer, function (err, result) {
                    callback.resolve(result.toString('utf8'));
                  });
                } else {
                  callback.resolve(buffer.toString('utf8'));
                }
              }
            });
          }
        });
      });
    }
  });

  return callback.promise;

};

/**
 * Gets latest cached data, as string, for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
*/
platform.io.cache.get.stringSync = function(path, tag, decompress){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // checking whether parent folder exists
  if (backend.existsSync(path + cachetag + '.' + cachetime) === false) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // decompressing data if requested and returning result
  if (decompress !== false) {
    return native.zlib.gunzipSync(backend.get.bytesSync(path + cachetag + '.' + cachetime)).toString('utf8');
  } else {
    return backend.get.bytesSync(path + cachetag + '.' + cachetime).toString('utf8');
  }
};

/**
 * Gets latest cached data, as bytes (Buffer), for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
 * @param {} [callback(err,data)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.get.bytes = function(path, tag, decompress, callback){

  // normalizing arguments
  if (callback == null && typeof decompress === 'function'){
    callback = decompress;
    decompress = null;
  }
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        // checking whether parent folder exists
        backend.exists(path + cachetag + '.' + cachetime,function(exists){
          if(exists === false){
            callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
          } else {
            // getting bytes from cache
            backend.get.bytes(path + cachetag + '.' + cachetime, function (err, buffer) {
              if (err) {
                callback.reject(err);
              } else {
                // decompressing data if requested and invoking callback with result
                if (decompress !== false) {
                  native.zlib.gunzip(buffer, function (err, result) {
                    callback.resolve(result);
                  });
                } else {
                  callback.resolve(buffer);
                }
              }
            });
          }
        });
      });
    }
  });

  return callback.promise;

};

/**
 * Gets latest cached data, as bytes (Buffer), for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
*/
platform.io.cache.get.bytesSync = function(path, tag, decompress){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // checking whether parent folder exists
  if (backend.existsSync(path + cachetag + '.' + cachetime) === false) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // decompressing data if requested and returning result
  if (decompress !== false) {
    return native.zlib.gunzipSync(backend.get.bytesSync(path + cachetag + '.' + cachetime));
  } else {
    return backend.get.bytesSync(path + cachetag + '.' + cachetime);
  }
};

/**
 * Gets read stream from latest cached data for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
 * @param {} [callback(err,stream)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.get.stream = function(path, tag, decompress, callback){

  // normalizing arguments
  if (callback == null && typeof decompress === 'function'){
    callback = decompress;
    decompress = null;
  }
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        // checking whether parent folder exists
        backend.exists(path + cachetag + '.' + cachetime,function(exists){
          if(exists === false){
            callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
          } else {
            // getting stream from cache
            backend.get.stream(path + cachetag + '.' + cachetime, null, function (err, streamBase) {
              if (err) {
                callback.reject(err);
              } else {
                // decompressing data if requested and invoking callback with result
                if (decompress !== false) {
                  var stream = streamBase.pipe(native.zlib.createGunzip());
                  callback.resolve(stream);
                }
                else {
                  callback.resolve(streamBase);
                }
              }
            });
          }
        });
      });
    }
  });

  return callback.promise;

};

/**
 * Gets read stream from latest cached data for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
*/
platform.io.cache.get.streamSync = function(path, tag, decompress){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // checking whether parent folder exists
  if (backend.existsSync(path + cachetag + '.' + cachetime) === false) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // decompressing data if requested and returning result
  if (decompress !== false) {
    return backend.get.streamSync(path + cachetag + '.' + cachetime).pipe(native.zlib.createGunzip());
  } else {
    return backend.get.streamSync(path + cachetag + '.' + cachetime);
  }

};

/**
 * Provides got implementations.
 * @type {Object}
*/
platform.io.cache.got = platform.io.cache.got || {};

/**
 * Gets previously cached data, as string, for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
 * @param {} [callback(err,data)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.got.string = function(path, tag, decompress, callback){

  // normalizing arguments
  if (callback == null && typeof decompress === 'function'){
    callback = decompress;
    decompress = null;
  }
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether parent folder exists
  backend.exists(filepath,function(exists){
    if (exists === false) {
      callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
    } else {
      // searching for any cached version of the file
      backend.list(filepath, null, false, filename + cachetag + '.*', function(err,candidates){
        // checking whether there is no cached version of the file
        if (candidates.length === 0) {
          callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
        } else {
          // getting bytes from cache for the first found (assuming only one version will be available)
          backend.get.bytes(filepath + native.path.sep + candidates[0], function (err, buffer) {
            if (err) {
              callback.reject(err);
            } else {
              // decompressing data if requested and invoking callback with result
              if (decompress !== false) {
                native.zlib.gunzip(buffer, function (err, result) {
                  callback.resolve(result.toString('utf8'));
                });
              } else {
                callback.resolve(buffer.toString('utf8'));
              }
            }
          });
        }
      })
    }
  });

  return callback.promise;
};

/**
 * Gets previously cached data, as string, for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
*/
platform.io.cache.got.stringSync = function(path, tag, decompress){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether parent folder exists
  if (backend.existsSync(filepath) === false) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // searching for any cached version of the file
  var candidates = backend.listSync(filepath, null, false, filename + cachetag + '.*');
  // checking whether there is no cached version of the file
  if (candidates.length === 0) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // decompressing data if requested and returning result from the first found (assuming only one version will be available)
  if (decompress !== false) {
    return native.zlib.gunzipSync(backend.get.bytesSync(filepath + native.path.sep + candidates[0])).toString('utf8');
  } else {
    return backend.get.bytesSync(filepath + native.path.sep + candidates[0]).toString('utf8');
  }
};

/**
 * Gets previously cached data, as bytes (Buffer), for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
 * @param {} [callback(err,data)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.got.bytes = function(path, tag, decompress, callback){

  // normalizing arguments
  if (callback == null && typeof decompress === 'function'){
    callback = decompress;
    decompress = null;
  }
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether parent folder exists
  backend.exists(filepath,function(exists){
    if (exists === false) {
      callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
    } else {
      // searching for any cached version of the file
      backend.list(filepath, null, false, filename + cachetag + '.*', function(err,candidates){
        // checking whether there is no cached version of the file
        if (candidates.length === 0) {
          callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
        } else {
          // getting bytes from cache for the first found (assuming only one version will be available)
          backend.get.bytes(filepath + native.path.sep + candidates[0], function (err, buffer) {
            if (err) {
              callback.reject(err);
            } else {
              // decompressing data if requested and invoking callback with result
              if (decompress !== false) {
                native.zlib.gunzip(buffer, function (err, result) {
                  callback.resolve(result);
                });
              } else {
                callback.resolve(buffer);
              }
            }
          });
        }
      })
    }
  });

  return callback.promise;
};

/**
 * Gets previously cached data, as bytes (Buffer), for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
*/
platform.io.cache.got.bytesSync = function(path, tag, decompress){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether parent folder exists
  if (backend.existsSync(filepath) === false) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // searching for any cached version of the file
  var candidates = backend.listSync(filepath, null, false, filename + cachetag + '.*');
  // checking whether there is no cached version of the file
  if (candidates.length === 0) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // decompressing data if requested and returning result from the first found (assuming only one version will be available)
  if (decompress !== false) {
    return native.zlib.gunzipSync(backend.get.bytesSync(filepath + native.path.sep + candidates[0]));
  } else {
    return backend.get.bytesSync(filepath + native.path.sep + candidates[0]);
  }
};

/**
 * Gets read stream from previously cached data for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
 * @param {} [callback(err,stream)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.got.stream = function(path, tag, decompress, callback){

  // normalizing arguments
  if (callback == null && typeof decompress === 'function'){
    callback = decompress;
    decompress = null;
  }
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether parent folder exists
  backend.exists(filepath,function(exists){
    if (exists === false) {
      callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
    } else {
      // searching for any cached version of the file
      backend.list(filepath, null, false, filename + cachetag + '.*', function(err,candidates){
        // checking whether there is no cached version of the file
        if (candidates.length === 0) {
          callback.reject(new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag))));
        } else {
          // getting bytes from cache for the first found (assuming only one version will be available)
          backend.get.stream(filepath + native.path.sep + candidates[0], null, function (err, streamBase) {
            if (err) {
              callback.reject(err);
            } else {
              // decompressing data if requested and invoking callback with result
              if (decompress !== false) {
                var stream = streamBase.pipe(native.zlib.createGunzip());
                callback.resolve(stream);
              } else {
                callback.resolve(streamBase);
              }
            }
          });
        }
      })
    }
  });

  return callback.promise;
};

/**
 * Gets read stream from previously cached data for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [decompress] Specifies whether decompress the cached data. Default is false.
*/
platform.io.cache.got.streamSync = function(path, tag, decompress){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // checking whether parent folder exists
  if (backend.existsSync(filepath) === false) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // searching for any cached version of the file
  var candidates = backend.listSync(filepath, null, false, filename + cachetag + '.*');
  // checking whether there is no cached version of the file
  if (candidates.length === 0) {
    throw new Exception('file %s not cached%s',path,((tag == null) ? '' : (' with tag ' + tag)));
  }

  // decompressing data if requested and returning result from the first found (assuming only one version will be available)
  if (decompress !== false) {
    return backend.get.streamSync(filepath + native.path.sep + candidates[0]).pipe(native.zlib.createGunzip());
  } else {
    return backend.get.streamSync(filepath + native.path.sep + candidates[0]);
  }
};

/**
 * Provides set implementations.
 * @type {Object}
*/
platform.io.cache.set = platform.io.cache.set || {};

/**
 * Sets latest cached data, as string, for a file.
 * @param {} path Specifies the target path.
 * @param {} data Specifies the data to be cached.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [callback(err)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.set.string = function(path, data, tag, callback){

  // normalizing arguments
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        // removing previous cached data
        platform.io.cache.unset(path,tag,function(err,success){
          if(success === false){
            if(platform.configuration.debug.cache === true) {
              console.debug('caching %s', path.replace(/\\/g,'/'));
            }
          } else {
            if(platform.configuration.debug.cache === true) {
              console.debug('recaching %s', path.replace(/\\/g,'/'));
            }
          }
          // creating tasks
          var tasks = [];
          // queueing export of raw data for debugging
          if (global.testing === true || global.development === true) {
            tasks.push(function (task_callback) {
              backend.set.string(path + cachetag + '.raw', data, task_callback);
            });
          }
          // queueing compression of data and writing to cache
          tasks.push(function(task_callback){
            // compressing bytes to cache
            native.zlib.gzip(new Buffer(data, 'utf8'), function (err, result) {
              if (err) {
                task_callback(err);
              } else {
                backend.set.bytes(path + cachetag + '.' + cachetime, result, task_callback);
              }
            });
          });
          // parallel execution of tasks
          native.async.parallel(tasks,function(err){
            if(err){
              callback.reject(err);
            } else {
              callback.resolve();
            }
          });
        })
      });
    }
  });

  return callback.promise;

};

/**
 * Sets latest cached data, as string, for a file.
 * @param {} path Specifies the target path.
 * @param {} data Specifies the data to be cached.
 * @param {} [tag] Specifies a custom tag for different cache variants.
*/
platform.io.cache.set.stringSync = function(path, data, tag){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // removing previous cached data
  if (platform.io.cache.unsetSync(path, tag) === false) {
    if(platform.configuration.debug.cache === true) {
      console.debug('caching %s', path.replace(/\\/g,'/'));
    }
  } else {
    if(platform.configuration.debug.cache === true) {
      console.debug('recaching %s', path.replace(/\\/g,'/'));
    }
  }

  // exporting raw data for debugging
  if (global.testing === true || global.development === true) {
    backend.set.stringSync(path + cachetag + '.raw', data);
  }

  // compressing data and writing to cache
  backend.set.bytesSync(path + cachetag + '.' + cachetime, native.zlib.gzipSync(new Buffer(data, 'utf8')));
};

/**
 * Sets latest cached data, as bytes (Buffer), for a file.
 * @param {} path Specifies the target path.
 * @param {} data Specifies the data to be cached.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [callback(err)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.set.bytes = function(path, data, tag, callback){

  // normalizing arguments
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        // removing previous cached data
        platform.io.cache.unset(path,tag,function(err,success){
          if(success === false){
            if(platform.configuration.debug.cache === true) {
              console.debug('caching %s', path.replace(/\\/g,'/'));
            }
          } else {
            if(platform.configuration.debug.cache === true) {
              console.debug('recaching %s', path.replace(/\\/g,'/'));
            }
          }
          // creating tasks
          var tasks = [];
          // queueing export of raw data for debugging
          if (global.testing === true || global.development === true) {
            tasks.push(function (task_callback) {
              backend.set.bytes(path + cachetag + '.raw', data, task_callback);
            });
          }
          // queueing compression of data and writing to cache
          tasks.push(function(task_callback){
            // compressing bytes to cache
            native.zlib.gzip(data, function (err, result) {
              if (err) {
                callback.reject(err);
              } else {
                backend.set.bytes(path + cachetag + '.' + cachetime, result, task_callback);
              }
            });
          });
          // parallel execution of tasks
          native.async.parallel(tasks,function(err){
            if(err){
              callback.reject(err);
            } else {
              callback.resolve();
            }
          });
        })
      });
    }
  });

  return callback.promise;
};

/**
 * Sets latest cached data, as bytes (Buffer), for a file.
 * @param {} path Specifies the target path.
 * @param {} data Specifies the data to be cached.
 * @param {} [tag] Specifies a custom tag for different cache variants.
*/
platform.io.cache.set.bytesSync = function(path, data, tag){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // removing previous cached data
  if (platform.io.cache.unsetSync(path, tag) === false) {
    if(platform.configuration.debug.cache === true) {
      console.debug('caching %s', path.replace(/\\/g,'/'));
    }
  } else {
    if(platform.configuration.debug.cache === true) {
      console.debug('recaching %s', path.replace(/\\/g,'/'));
    }
  }

  // exporting raw data for debugging
  if (global.testing === true || global.development === true) {
    backend.set.bytesSync(path + cachetag + '.raw', data);
  }

  // compressing data and writing to cache
  backend.set.bytesSync(path + cachetag + '.' + cachetime, native.zlib.gzipSync(data));
};

/**
 * Gets write stream to latest cached data for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [callback(err,stream)] Callback for node async pattern or null to get a Promise (to support await).
*/
platform.io.cache.set.stream = function(path, tag, callback){

  // normalizing arguments
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  var stream = null;

  // getting ticks from mtime as cache version
  platform.io.exists(path,function(exists){
    if (exists === false) {
      cachetime = 0;
    } else {
      platform.io.info(path,function(err,stats){
        if (err) {
          cachetime = 0;
        } else {
          cachetime = stats.mtime.getTime();
        }
        // removing previous cached data
        platform.io.cache.unset(path,tag,function(err,success){
          if(success === false){
            if(platform.configuration.debug.cache === true) {
              console.debug('caching %s', path.replace(/\\/g,'/'));
            }
          } else {
            if(platform.configuration.debug.cache === true) {
              console.debug('recaching %s', path.replace(/\\/g,'/'));
            }
          }
          // creating gzipped stream for cache
          stream = native.zlib.createGzip();
          // creating stream in cache
          backend.set.stream(path + cachetag + '.' + cachetime, null, function (err, streamBase) {
            if (err) {
              callback.reject(err);
            } else {
              stream.pipe(streamBase);
              callback.resolve(stream);
            }
          });
        })
      });
    }
  });

  return callback.promise;

};

/**
 * Gets write stream to latest cached data for a file.
 * @param {} path Specifies the target path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
*/
platform.io.cache.set.streamSync = function(path, tag){
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  var cachetime = null;
  var stream = null;

  // getting ticks from mtime as cache version
  if (platform.io.existsSync(path) === false) {
    cachetime = 0;
  } else {
    cachetime = platform.io.infoSync(path).mtime.getTime();
  }

  // removing previous cached data
  if (platform.io.cache.unsetSync(path, tag) === false) {
    if(platform.configuration.debug.cache === true) {
      console.debug('caching %s', path.replace(/\\/g,'/'));
    }
  } else {
    if(platform.configuration.debug.cache === true) {
      console.debug('recaching %s', path.replace(/\\/g,'/'));
    }
  }

  // creating gzipped stream for cache
  stream = native.zlib.createGzip();
  var streamBase = backend.set.streamSync(path + cachetag + '.' + cachetime);
  stream.pipe(streamBase);
  streamBase.on('open',function(){
    stream.emit('open');
  });
  return stream;

};

/**
 * Removes all cached versions of a file.
 * @param {} path Specifies the target file path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @param {} [callback(err,success)] Callback for node async pattern or null to get a Promise (to support await).
 * @return {} Returns true if any cached versions has been deleted.
*/
platform.io.cache.unset = function(path, tag, callback) {

  // normalizing arguments
  if (callback == null && typeof tag === 'function'){
    callback = tag;
    tag = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // skipping search if file path doesn't exist
  backend.exists(filepath,function(exists){
    if(exists === false) {
      callback.resolve(false);
    } else {
      // deleting all cached versions of a file
      backend.list(filepath, null, false, filename + cachetag + '.*',function(err,files){
        if (err){
          callback.reject(err);
        } else {
          if (files.length === 0) {
            callback.resolve(false);
          } else {
            if(platform.configuration.debug.cache === true) {
              console.debug('uncaching %s', path.replace(/\\/g,'/'));
            }
            // creating tasks
            var tasks = [];
            files.forEach(function (file) {
              tasks.push(function(task_callback) {
                backend.delete(filepath + native.path.sep + file,function(err){
                  task_callback(err);
                });
              });
            });
            // parallel execution of tasks
            native.async.parallel(tasks,function(err){
              if(err){
                callback.reject(err);
              } else {
                callback.resolve(true);
              }
            });
          }
        }
      });
    }
  });

  return callback.promise;

};

/**
 * Removes all cached versions of a file.
 * @param {} path Specifies the target file path.
 * @param {} [tag] Specifies a custom tag for different cache variants.
 * @return {} Returns true if any cached versions has been deleted.
*/
platform.io.cache.unsetSync = function(path, tag) {
  // get cache backend
  var backend = platform.io.backends.cache;

  // preparing cache tag
  var cachetag = tag;
  if (cachetag === undefined || cachetag === null) {
    cachetag = '';
  }
  if (cachetag !== '') {
    cachetag = '.' + cachetag;
  }

  // getting file name and path
  var filename = native.path.basename(path);
  var filepath = native.path.dirname(path);

  // skipping search if file path doesn't exist
  if (backend.existsSync(filepath) === false) {
    return false;
  }

  // deleting all cached versions of a file
  var result = backend.listSync(filepath, null, false, filename + cachetag + '.*');
  if (result.length === 0) {
    return false;
  } else {
    if(platform.configuration.debug.cache === true) {
      console.debug('uncaching %s', path.replace(/\\/g,'/'));
    }
    result.forEach(function (file) {
      backend.deleteSync(filepath + native.path.sep + file);
    });
    return true;
  }
};

// registering 'cache' store as new filesystem backend with server root path + /cache/
//TODO: allow cache store override by configuration
platform.io.store.register('cache',platform.kernel.new('core.io.store.file',[ native.path.join(platform.configuration.runtime.path.root,'cache') ]),-1,true);

// cleaning cache if requested by global configuration (only if current is the master node)
if (platform.configuration.cache.startup.clean === true
  && platform.state === platform._states.PRELOAD
//? if (CLUSTER) {
  && platform.cluster.worker.master === true
//? }
  ){
  console.debug('cleaning cache');
  platform.io.cache.cleanSync();
}
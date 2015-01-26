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

//N: Provides IO helper with abstract filesystem and packaged module support.
platform.io = platform.io || {};

//N: Provides managed cache IO support.
platform.io.cache = platform.io.cache || {};

//F: Clean the whole cache.
//A: [callback(err)]: Callback for async support.
platform.io.cache.clean = function(callback){
  if (typeof callback !== 'function') {
    //C: deleting and recreating root in cache IO backend
    platform.io.cache._backend.delete('/');
    platform.io.cache._backend.create('/');
  } else {
    //C: deleting root in cache IO backend
    platform.io.cache._backend.delete('/',function(err){
      if (err) {
        callback(err);
      } else {
        //C: creating root in cache IO backend
        platform.io.cache._backend.create('/',function(err){
          if(err){
            callback(err);
          } else {
            callback();
          }
        });
      }
    });
  }
};

//F: Checks whether the latest version of a file is cached.
//A: path: Specifies the target file path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [callback(err,result)]: Callback for async support.
//R: Returns true if the latest version of the file is cached.
platform.io.cache.is = function(path, tag, callback){
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

  var cachetime = null;
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
    }

    //C: checking for latest cached version of the file
    return backend.exists(path + cachetag + '.' + cachetime);
  } else {
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
            callback(null,exists);
          });
        });
      }
    });
    return null;
  }
};

//F: Checks whether any version of a file is cached (maybe not the latest one).
//A: path: Specifies the target file path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [callback(err,result)]: Callback for async support.
//R: Returns true if any version of the file.
platform.io.cache.was = function(path, tag, callback){
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

  if (typeof callback !== 'function') {
    //C: checking whether file exists
    if (backend.exists(filepath) === false) {
      return false;
    }

    //C: searching cached versions of the file
    return (backend.list(filepath, null, false, filename + cachetag + '.*').length > 0);
  } else {
    backend.exists(filepath,function(exists){
      if (exists === false) {
        callback(null,false);
      } else {
        backend.list(filepath, null, false, filename + cachetag + '.*',function(err,files){
          if (err) {
            callback(err);
          } else {
            callback(err,(files.length > 0));
          }
        });
      }
    });
    return null;
  }
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

  //C: getting file name and path
  var filepath = native.path.dirname(path);

  var cachetime = null;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
    }

    //C: checking whether parent folder exists
    if (backend.exists(path + cachetag + '.' + cachetime) === false) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(path + cachetag + '.' + cachetime)).toString('utf8');
    } else {
      return backend.get.bytes(path + cachetag + '.' + cachetime).toString('utf8');
    }
  } else {
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
            if(exists === false){
              callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
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
          });
        });
      }
    });
    return null;
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

  //C: getting file name and path
  var filepath = native.path.dirname(path);

  var cachetime = null;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
    }

    //C: checking whether parent folder exists
    if (backend.exists(path + cachetag + '.' + cachetime) === false) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(path + cachetag + '.' + cachetime));
    } else {
      return backend.get.bytes(path + cachetag + '.' + cachetime);
    }
  } else {
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
            if(exists === false){
              callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
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
          });
        });
      }
    });
    return null;
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

  //C: getting file name and path
  var filepath = native.path.dirname(path);

  var cachetime = null;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
    }

    //C: checking whether parent folder exists
    if (backend.exists(path + cachetag + '.' + cachetime) === false) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: decompressing data if requested and returning result
    if (decompress !== false) {
      return backend.get.stream(path + cachetag + '.' + cachetime).pipe(native.zlib.createGunzip());
    } else {
      return backend.get.stream(path + cachetag + '.' + cachetime);
    }
  } else {
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
            if(exists === false){
              callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
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
          });
        });
      }
    });
    return null;
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

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: checking whether parent folder exists
    if (backend.exists(filepath) === false) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: searching for any cached version of the file
    var candidates = backend.list(filepath, null, false, filename + cachetag + '.*');
    //C: checking whether there is no cached version of the file
    if (candidates.length === 0) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: decompressing data if requested and returning result from the first found (assuming only one version will be available)
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(filepath + native.path.sep + candidates[0])).toString('utf8');
    } else {
      return backend.get.bytes(filepath + native.path.sep + candidates[0]).toString('utf8');
    }
  } else {
    backend.exists(filepath,function(exists){
      if (exists === false) {
        callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
      } else {
        backend.list(filepath, null, false, filename + cachetag + '.*', function(err,candidates){
          if (candidates.length === 0) {
            callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
          } else {
            //C: getting bytes from cache for the first found (assuming only one version will be available)
            backend.get.bytes(filepath + native.path.sep + candidates[0], function (err, buffer) {
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
        })
      }
    });
    return null;
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

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: checking whether parent folder exists
    if (backend.exists(filepath) === false) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: searching for any cached version of the file
    var candidates = backend.list(filepath, null, false, filename + cachetag + '.*');
    //C: checking whether there is no cached version of the file
    if (candidates.length === 0) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: decompressing data if requested and returning result from the first found (assuming only one version will be available)
    if (decompress !== false) {
      return native.zlib.gunzipSync(backend.get.bytes(filepath + native.path.sep + candidates[0]));
    } else {
      return backend.get.bytes(filepath + native.path.sep + candidates[0]);
    }
  } else {
    backend.exists(filepath,function(exists){
      if (exists === false) {
        callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
      } else {
        backend.list(filepath, null, false, filename + cachetag + '.*', function(err,candidates){
          if (candidates.length === 0) {
            callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
          } else {
            //C: getting bytes from cache for the first found (assuming only one version will be available)
            backend.get.bytes(filepath + native.path.sep + candidates[0], function (err, buffer) {
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
        })
      }
    });
    return null;
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

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: checking whether parent folder exists
    if (backend.exists(filepath) === false) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: searching for any cached version of the file
    var candidates = backend.list(filepath, null, false, filename + cachetag + '.*');
    //C: checking whether there is no cached version of the file
    if (candidates.length === 0) {
      throw new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag);
    }

    //C: decompressing data if requested and returning result from the first found (assuming only one version will be available)
    if (decompress !== false) {
      return backend.get.stream(filepath + native.path.sep + candidates[0]).pipe(native.zlib.createGunzip());
    } else {
      return backend.get.stream(filepath + native.path.sep + candidates[0]);
    }
  } else {
    backend.exists(filepath,function(exists){
      if (exists === false) {
        callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
      } else {
        backend.list(filepath, null, false, filename + cachetag + '.*', function(err,candidates){
          if (candidates.length === 0) {
            callback(new Exception('resource %s not cached' + (cachetag === '') ? '' : ' with tag %s',path,tag));
          } else {
            //C: getting bytes from cache for the first found (assuming only one version will be available)
            backend.get.stream(filepath + native.path.sep + candidates[0], null, function (err, streamBase) {
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
        })
      }
    });
    return null;
  }
};

//O: Provides set implementations.
platform.io.cache.set = {};

//F: Sets latest cached data, as string, for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: data: Specifies the data to be cached.
//A: [callback(err)]: Callback for async support.
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

  var cachetime = null;
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
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
      backend.set.string(path + cachetag + '.raw', data);
    }

    //C: compressing data and writing to cache
    backend.set.bytes(path + cachetag + '.' + cachetime, native.zlib.gzipSync(new Buffer(data, 'utf8')));
  } else {
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
          platform.io.cache.unset(path,tag,function(err,success){
            if(success === false){
              if(platform.configuration.server.debugging.cache === true) {
                console.debug('caching %s', path);
              }
            } else {
              if(platform.configuration.server.debugging.cache === true) {
                console.debug('recaching %s', path);
              }
            }
            var tasks = [];
            if (global.testing === true || global.development === true) {
              tasks.push(function (task_callback) {
                backend.set.string(path + cachetag + '.raw', data, task_callback);
              });
            }
            tasks.push(function(task_callback){
              //C: compressing bytes to cache
              native.zlib.gzip(new Buffer(data, 'utf8'), function (err, result) {
                if (err) {
                  task_callback(err);
                } else {
                  backend.set.bytes(path + cachetag + '.' + cachetime, result, task_callback);
                }
              });
            });
            native.async.parallel(tasks,function(err){
              if(err){
                callback(err);
              } else {
                callback();
              }
            });
          })
        });
      }
    });
    return null;
  }
};

//F: Sets latest cached data, as bytes (Buffer), for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: data: Specifies the data to be cached.
//A: [callback(err)]: Callback for async support.
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

  var cachetime = null;
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
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
      backend.set.string(path + cachetag + '.raw', data);
    }

    //C: compressing data and writing to cache
    backend.set.bytes(path + cachetag + '.' + cachetime, native.zlib.gzipSync(data));
  } else {
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
          platform.io.cache.unset(path,tag,function(err,success){
            if(success === false){
              if(platform.configuration.server.debugging.cache === true) {
                console.debug('caching %s', path);
              }
            } else {
              if(platform.configuration.server.debugging.cache === true) {
                console.debug('recaching %s', path);
              }
            }
            var tasks = [];
            if (global.testing === true || global.development === true) {
              tasks.push(function (task_callback) {
                backend.set.bytes(path + cachetag + '.raw', data, task_callback);
              });
            }
            tasks.push(function(task_callback){
              //C: compressing bytes to cache
              native.zlib.gzip(data, function (err, result) {
                if (err) {
                  callback(err);
                } else {
                  backend.set.bytes(path + cachetag + '.' + cachetime, result, task_callback);
                }
              });
            });
            native.async.parallel(tasks,function(err){
              if(err){
                callback(err);
              } else {
                callback();
              }
            });
          })
        });
      }
    });
    return null;
  }
};

//F: Gets write stream to latest cached data for a file.
//A: path: Specifies the target path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [callback(err,stream)]: Callback for async support.
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

  var cachetime = null;
  var stream = null;
  if (typeof callback !== 'function') {
    //C: getting ticks from mtime as cache version
    if (platform.io.exists(path) === false) {
      cachetime = 0;
    } else {
      cachetime = platform.io.info(path).mtime.getTime();
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
      backend.set.string(path + cachetag + '.raw', data);
    }

    //C: creating gzipped stream for cache
    stream = native.zlib.createGzip();
    var streamBase = backend.set.stream(path + cachetag + '.' + cachetime);
    stream.pipe(streamBase);
    streamBase.on('open',function(){
      stream.emit('open');
    });
    return stream;
  } else {
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
          platform.io.cache.unset(path,tag,function(err,success){
            if(success === false){
              if(platform.configuration.server.debugging.cache === true) {
                console.debug('caching %s', path);
              }
            } else {
              if(platform.configuration.server.debugging.cache === true) {
                console.debug('recaching %s', path);
              }
            }
            //C: creating gzipped stream for cache
            stream = native.zlib.createGzip();
            //C: creating stream in cache
            backend.set.stream(path + cachetag + '.' + cachetime, null, function (err, streamBase) {
              if (err) {
                callback(err);
              } else {
                stream.pipe(streamBase);
                callback(null, stream);
              }
            });
          })
        });
      }
    });
    return null;
  }
};

//F: Removes all cached versions of a file.
//A: path: Specifies the target file path.
//A: [tag]: Specifies a custom tag for different cache variants.
//A: [callback(err,success)]: Callback for async support.
//R: Returns true if any cached versions has been deleted.
platform.io.cache.unset = function(path, tag, callback) {
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

  if (typeof callback !== 'function') {
    //C: skipping search if file path doesn't exist
    if (backend.exists(filepath) === false) {
      return false;
    }

    //C: deleting all cached versions of a file
    var result = backend.list(filepath, null, false, filename + cachetag + '.*');
    if (result.length === 0) {
      return false;
    } else {
      result.forEach(function (file) {
        backend.delete(filepath + native.path.sep + file);
      });
      return true;
    }
  } else {
    backend.exists(filepath,function(exists){
      if(exists === false) {
        callback(null,false);
      } else {
        backend.list(filepath, null, false, filename + cachetag + '.*',function(err,files){
          if (err){
            callback(err);
          } else {
            if (files.length === 0) {
              callback(null,false);
            } else {
              var tasks = [];
              files.forEach(function (file) {
                tasks.push(function(task_callback) {
                  backend.delete(filepath + native.path.sep + file,function(err){
                    task_callback(err);
                  });
                });
              });
              native.async.parallel(tasks,function(err){
                if(err){
                  callback(err);
                } else {
                  callback(null,true);
                }
              });
            }
          }
        });
      }
    });
    return null;
  }
};

//C: registering 'cache' store as new filesystem backend with app root path + /cache/
//T: allow cache store override by configuration
platform.io.store.register('cache',platform.kernel.new('core.io.store.file',[ native.path.join(platform.runtime.path.app,'cache') ]),-1);

//V: Stores the 'cache' store backend.
platform.io.cache._backend = platform.io.store.getByName('cache');

if (platform.configuration.server.cache.startup.clean === true){
  platform.io.cache.clean();
}
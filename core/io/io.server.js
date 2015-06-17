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

//TODO: normalize optional arguments

/**
 * Provides IO helper with abstract filesystem and packaged module support.
 * @namespace
*/
platform.io = platform.io || {};

//TODO: implement iterator instead of forEach-ing list()

/**
 * Maps the path against the absolute filesystem.
 * @param {} path Specifies the target path.
 * @param {} [root] Specifies the relative root. If missing, the path is mapped against the application root.
 * @return {} Returns the absolute path.
*/
platform.io.map = function(path,root) {
  var normalized_path = path;
  // sanitizing empty path
  if (normalized_path === '') {
    normalized_path = '/';
  }
  //TODO: check if really neede on windows platforms
  // fixing separator (is it useful?)
  /*if (native.path.sep === '\\') {
   normalized_path = normalized_path.replace('/', '\\');
   }*/
  // normalizing through natives
  normalized_path = native.path.normalize(normalized_path);
  // returning path joined to custom or server root
  return native.path.join(root||platform.configuration.runtime.path.root, normalized_path);
};

platform.io.getShortPath = function(fullpath){
  // getting backends by priority
  var backends = platform.io.store.listAll();
  var backends_length = backends.length;
  var index;
  var backend;

  // cycling for all backends
  for (index = 0; index < backends_length; index++) {
    backend = backends[index];
    // detecting if path exists in current backend
    if (fullpath.startsWith(backend.base) === true){
      return fullpath.replace(backend.base, backend.name + ':' + native.path.sep);
    }
  }
  return 'unknown:'  + native.path.sep + path;
};

/**
 * Resolves the path throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @param {} [callback(err,fullpath)] Callback for async support. If missing, the function operates syncronously.
 * @return {} Returns the first valid absolute overlay path.
*/
platform.io.resolve = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // storing the result in a temporary variable
    var result = null;
    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          if (exists === true){
            // storing found and resolved path
            result = {
              'fullpath': native.path.join(backend.base,path),
              'backend': backend,
              'shortpath': /*backend.name + ':' + '/' + ((path[0] === native.path.sep) ? '' : '/') +*/ path.replace(/\\/g,'/')
            };
          }
          internal_callback(null);
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          // invoking the callback with the result
          callback.resolve(result);
        }
      }
    );

  return callback.promise;
};

/**
 * Resolves the path throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @return {} Returns the first valid absolute overlay path.
*/
platform.io.resolveSync = function(path){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

     // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true){
        return {
          'fullpath': native.path.join(backend.base,path),
          'backend': backend,
          'shortpath': /*backend.name + ':' + '/' + ((path[0] === native.path.sep) ? '' : '/') +*/ path.replace(/\\/g,'/')
        };
      }
    }
    return null;

};

/**
 * Checks whether path exist (file or directory) throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @param {} [callback(err,exists)] Callback for async support. If missing, the function operates syncronously.
 * @return {} Returns true or false.
*/
platform.io.exists = function(path,callback) {

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // storing the result in a temporary variable
    var result = false;
    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result === false);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          // storing found and resolved path
          result = exists;
          internal_callback(null);
        });
      },
      function(err){
        callback.resolve(result);
      }
    );

  return callback.promise;
};

/**
 * Checks whether path exist (file or directory) throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @return {} Returns true or false.
*/
platform.io.existsSync = function(path) {
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true) {
        return true;
      }
    }
    return false;

};

/**
 * Gets info for path (file or directory) throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @param {} [callback(err,stats)] Callback for async support. If missing, the function operates syncronously.
 * @return {} Returns fs.Stats class.
*/
platform.io.info = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;


    // storing the result in a temporary variable
    var result = null;
    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          if (exists === true){
            backend.info(path,function(err,stats){
              // storing found and resolved path
              result = stats;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          if (result == null) {
            callback.reject(new Exception('file %s does not exist', path));
          } else {
            // invoking the callback with the result
            callback.resolve(result);
          }
        }
      }
    );

  return callback.promise;
};

/**
 * Gets info for path (file or directory) throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @return {} Returns fs.Stats class.
*/
platform.io.infoSync = function(path){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true) {
        return backend.infoSync(path);
      }
    }
    throw new Exception('file %s does not exist', path);

};

/**
 * Provides get implementations.
 * @type {Object}
*/
platform.io.get = {};

/**
 * Gets whole data as string from file throughout the overlay abstract filesystem.
 * @param {} path Specifies the target file path.
 * @param {} [callback(err,data)] Callback for async support. If missing, the function operates synchronously.
 * @return {} Returns data as string.
*/
platform.io.get.string = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;


    // storing the result in a temporary variable
    var result = null;
    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          if (exists === true){
            backend.get.string(path,function(err,data){
              // storing found and resolved path
              result = data;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          // invoking the callback with the result
          if (result == null){
            callback.reject(new Exception('file %s does not exist', path));
          } else {
            callback.resolve(result);
          }
        }
      }
    );

  return callback.promise;
};

/**
 * Gets whole data as string from file throughout the overlay abstract filesystem.
 * @param {} path Specifies the target file path.
 * @return {} Returns data as string.
*/
platform.io.get.stringSync = function(path){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true) {
        return backend.get.stringSync(path);
      }
    }
    throw new Exception('file %s does not exist', path);

};

/**
 * Gets whole data as bytes (Buffer) from file throughout the overlay abstract filesystem.
 * @param {} path Specifies the target file path.
 * @param {} [callback(err,data)] Callback for async support. If missing, the function operates synchronously.
 * @return {} Returns data as bytes (Buffer).
*/
platform.io.get.bytes = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;


    // storing the result in a temporary variable
    var result = null;
    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          if (exists === true){
            backend.get.bytes(path,function(err,data){
              // storing found and resolved path
              result = data;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          // invoking the callback with the result
          if (result == null){
            callback.reject(new Exception('file %s does not exist', path));
          } else {
            callback.resolve(result);
          }
        }
      }
    );

  return callback.promise;
};

/**
 * Gets whole data as bytes (Buffer) from file throughout the overlay abstract filesystem.
 * @param {} path Specifies the target file path.
 * @return {} Returns data as bytes (Buffer).
*/
platform.io.get.bytesSync = function(path){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true) {
        return backend.get.bytesSync(path);
      }
    }
    throw new Exception('file %s does not exist', path);

};

/**
 * Gets read stream for file throughout the overlay abstract filesystem.
 * @param {} path Specifies the target file path.
 * @param {} [callback(err,stream)] Callback for async support. If missing, the function operates synchronously.
 * @param {} [options] Specifies options to be passed to fs.createReadStream.
 * @return {} Returns read stream.
*/
platform.io.get.stream = function(path,options,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;


    // storing the result in a temporary variable
    var result = null;
    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          if (exists === true){
            backend.get.stream(path,options,function(err,stream){
              // storing found and resolved path
              result = stream;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          // invoking the callback with the result
          if (result == null){
            var stream = native.stream.Writable();
            setImmediate(function () {
              stream.emit('error', new Exception('file %s does not exist', path));
            });
            callback.resolve(stream);
          } else {
            callback.resolve(result);
          }
        }
      }
    );

  return callback.promise;
};

/**
 * Gets read stream for file throughout the overlay abstract filesystem.
 * @param {} path Specifies the target file path.
 * @param {} [options] Specifies options to be passed to fs.createReadStream.
 * @return {} Returns read stream.
*/
platform.io.get.streamSync = function(path,options){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true) {
        return backend.get.streamSync(path, options);
      }
    }
    var stream = native.stream.Writable();
    setImmediate(function () {
      stream.emit('error', new Exception('file %s does not exist', path));
    });
    return stream;

};

/**
 * Creates a file or directory if the path doesn't exist through the first backend.
 * @param {} path Specifies the target path (directory if it ends with '/').
 * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
*/
platform.io.create = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  backend.create(path,function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Creates a file or directory if the path doesn't exist through the first backend.
 * @param {} path Specifies the target path (directory if it ends with '/').
*/
platform.io.createSync = function(path){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.createSync(path);
};

/**
 * Provides set implementations.
 * @type {Object}
*/
platform.io.set = {};

/**
 * Sets data from string to file through the first backend (overwrites contents).
 * @param {} path Specifies the target file path.
 * @param {} data Specifies the data to be written, as string.
 * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
*/
platform.io.set.string = function(path,data,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  backend.set.string(path, data, function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Sets data from string to file through the first backend (overwrites contents).
 * @param {} path Specifies the target file path.
 * @param {} data Specifies the data to be written, as string.
*/
platform.io.set.stringSync = function(path,data){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
    return backend.set.stringSync(path, data);
};

/**
 * Sets data from bytes (Buffer) to file through the first backend (overwrites contents).
 * @param {} path Specifies the target file path.
 * @param {} data Specifies the data to be written, as bytes (Buffer).
 * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
*/
platform.io.set.bytes = function(path,data,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  // detecting if operate asynchronously or synchronously
  backend.set.bytes(path, data, function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Sets data from bytes (Buffer) to file through the first backend (overwrites contents).
 * @param {} path Specifies the target file path.
 * @param {} data Specifies the data to be written, as bytes (Buffer).
*/
platform.io.set.bytesSync = function(path,data){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.set.bytesSync(path, data);
};

/**
 * Sets write stream for file through the first backend (overwrites contents).
 * @param {} path Specifies the target file path.
 * @param {} [options] Specifies options to be passed to fs.createWriteStream.
 * @param {} [callback(err,stream)] Callback for async support. If missing, the function operates synchronously.
*/
platform.io.set.stream = function(path,options,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  backend.set.stream(path, options, function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Sets write stream for file through the first backend (overwrites contents).
 * @param {} path Specifies the target file path.
 * @param {} [options] Specifies options to be passed to fs.createWriteStream.
*/
platform.io.set.streamSync = function(path,options){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.set.streamSync(path, options);
};

/**
 * Deletes a path through the first backend (file or directory).
 * @function platform.io.delete
 * @param {} path Specifies the target path.
 * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
*/
platform.io.delete = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  backend.delete(path,function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Deletes a path through the first backend (file or directory).
 * @param {} path Specifies the target path.
*/
platform.io.deleteSync = function(path){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.deleteSync(path);
};

/**
 * Renames a path (file or directory) through the first backend.
 * @param {} oldpath Specifies the old target path.
 * @param {} newpath Specifies the new target path.
 * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
*/
platform.io.rename = function(oldpath,newpath,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  backend.rename(oldpath,newpath,function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Renames a path (file or directory) through the first backend.
 * @param {} oldpath Specifies the old target path.
 * @param {} newpath Specifies the new target path.
*/
platform.io.renameSync = function(oldpath,newpath){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.renameSync(oldpath,newpath);
};

/**
 * Finds all files in a path through the first backend.
 * @param {} path Specifies the target path.
 * @param {} [type] Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
 * @param {} [deep] Specifies if search should be recursive. Default is false.
 * @param {} [filter] Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
 * @param {} [callback(err,result)] Callback for async support (currently fake implementation). If missing, the function operates synchronously.
 * @return {} Returns results as array of strings.
*/
platform.io.list = function(path,type,deep,filter,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  backend.list(path,type,deep,filter,function(error,result){
    if (error) {
      callback.reject(error);
    } else {
      callback.resolve(result);
    }
  });

  return callback.promise;
};

/**
 * Finds all files in a path through the first backend.
 * @param {} path Specifies the target path.
 * @param {} [type] Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
 * @param {} [deep] Specifies if search should be recursive. Default is false.
 * @param {} [filter] Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
 * @return {} Returns results as array of strings.
*/
platform.io.listSync = function(path,type,deep,filter){
  // getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.listSync(path,type,deep,filter);
};

/**
 * Resolves the path throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @param {} [callback(err,fullpaths)] Callback for async support. If missing, the function operates syncronously.
 * @return {} Returns all valid absolute overlay paths as array of objects {path,backend}.
*/
platform.io.resolveAll = function(path,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;
  var result = {};

    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of no more backends
        return (index < backends_length);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.exists(path,function(exists){
          if (exists === true){
            // storing found and resolved path
            result[backend.name] = {
              'fullpath': native.path.join(backend.base,path),
              'backend': backend,
              'shortpath': /*backend.name + ':' + '/' + ((path[0] === native.path.sep) ? '' : '/') +*/ path.replace(/\\/g,'/')
            };
          }
          internal_callback(null);
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          // invoking the callback with the result
          callback.resolve(result);
        }
      }
    );

  return callback.promise;
};

/**
 * Resolves the path throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @return {} Returns all valid absolute overlay paths as array of objects {path,backend}.
*/
platform.io.resolveAllSync = function(path){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;
  var result = {};

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true) {
        result[backend.name] = {
          'fullpath': native.path.join(backend.base,path),
          'backend': backend,
          'shortpath': /*backend.name + ':' + '/' + ((path[0] === native.path.sep) ? '' : '/') +*/ path.replace(/\\/g,'/')
        };
      }
    }
    return result;
};

/**
 * Finds all files in a path throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @param {} [type] Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
 * @param {} [deep] Specifies if search should be recursive. Default is false.
 * @param {} [filter] Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
 * @param {} [callback(err,results)] Callback for async support (currently fake implementation). If missing, the function operates synchronously.
 * @return {} Returns results as object with backend name as properties and array of strings as values.
*/
platform.io.listAll = function(path,type,deep,filter,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;
  var result = {};

    // storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        // moving to the next backend
        index++;
        // checking if iteration should stopped because of no more backends
        return (index < backends_length);
      },
      function(internal_callback) {
        // getting current backend
        backend = backends[index];
        // checking if file exists in current backend
        backend.list(path,type,deep,filter,function(err,files){
          if (err){
            internal_callback(err);
          } else {
            // storing found entries
            result[backend.name] = files;
            internal_callback(null);
          }
        });
      },
      function(err){
        // checking if any error occurred
        if (err) {
          callback.reject(err);
        } else {
          // invoking the callback with the result
          callback.resolve(result);
        }
      }
    );

  return callback.promise;
};

/**
 * Finds all files in a path throughout the overlay abstract filesystem.
 * @param {} path Specifies the target path.
 * @param {} [type] Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
 * @param {} [deep] Specifies if search should be recursive. Default is false.
 * @param {} [filter] Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
 * @return {} Returns results as object with backend name as properties and array of strings as values.
*/
platform.io.listAllSync = function(path,type,deep,filter){
  // getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;
  var result = {};

    // cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      // detecting if path exists in current backend
      if (backend.existsSync(path) === true){
        result[backend.name] = backend.listSync(path,deep,filter);
      }
    }
    return result;
};

// registering system root folder as 'system' store
platform.io.store.register('system',platform.kernel.new('core.io.store.file',[ '/' ]),1000,true);

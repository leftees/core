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

//T: implement iterator instead of forEach-ing list()

//F: Maps the path against the absolute filesystem.
//A: path: Specifies the target path.
//A: [root]: Specifies the relative root. If missing, the path is mapped against the application root.
//R: Returns the absolute path.
platform.io.map = function(path,root) {
  var normalized_path = path;
  //C: sanitizing empty path
  if (normalized_path === '') {
    normalized_path = '/';
  }
  //T: check if really neede on windows platforms
  //C: fixing separator (is it useful?)
  /*if (native.path.sep === '\\') {
   normalized_path = normalized_path.replace('/', '\\');
   }*/
  //C: normalizing through natives
  normalized_path = native.path.normalize(normalized_path);
  //C: returning path joined to custom or app root
  return native.path.join(root||platform.runtime.path.app, normalized_path);
};

//F: Resolves the path throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//A: [callback(err,fullpath)]: Callback for async support. If missing, the function operates syncronously.
//R: Returns the first valid absolute overlay path.
platform.io.resolve = function(path,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function'){
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true){
        return native.path.join(backend.base,path);
      }
    }
    return null;
  } else {
    //C: storing the result in a temporary variable
    var result = null;
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          if (exists === true){
            //C: storing found and resolved path
            result = native.path.join(backend.base,path);
          }
          internal_callback(null);
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          callback(null,result);
        }
      }
    );
  }
};

//F: Checks whether path exist (file or directory) throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//A: [callback(err,exists)]: Callback for async support. If missing, the function operates syncronously.
//R: Returns true or false.
platform.io.exist = function(path,callback) {
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true) {
        return true;
      }
    }
    return false;
  } else {
    //C: storing the result in a temporary variable
    var result = false;
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result === false);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          //C: storing found and resolved path
          result = exists;
          internal_callback(null);
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          callback(null,result);
        }
      }
    );
  }
};

//F: Gets info for path (file or directory) throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//A: [callback(err,stats)]: Callback for async support. If missing, the function operates syncronously.
//R: Returns fs.Stats class.
platform.io.info = function(path,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true) {
        return backend.info(path);
      }
    }
    throw new Exception('resource %s does not exist', path);
  } else {
    //C: storing the result in a temporary variable
    var result = null;
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          if (exists === true){
            backend.info(path,function(err,stats){
              //C: storing found and resolved path
              result = stats;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          callback(null,result);
        }
      }
    );
  }
};

//O: Provides get implementations.
platform.io.get = {};

//F: Gets whole data as string from file throughout the overlay abstract filesystem.
//A: path: Specifies the target file path.
//A: [callback(err,data)]: Callback for async support. If missing, the function operates synchronously.
//R: Returns data as string.
platform.io.get.string = function(path,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true) {
        return backend.get.string(path);
      }
    }
    throw new Exception('resource %s does not exist', path);
  } else {
    //C: storing the result in a temporary variable
    var result = null;
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          if (exists === true){
            backend.get.string(path,function(err,data){
              //C: storing found and resolved path
              result = data;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          if (result == null){
            callback(new Exception('resource %s does not exist', path));
          } else {
            callback(null, result);
          }
        }
      }
    );
  }
};

//F: Gets whole data as bytes (Buffer) from file throughout the overlay abstract filesystem.
//A: path: Specifies the target file path.
//A: [callback(err,data)]: Callback for async support. If missing, the function operates synchronously.
//R: Returns data as bytes (Buffer).
platform.io.get.bytes = function(path,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true) {
        return backend.get.bytes(path);
      }
    }
    throw new Exception('resource %s does not exist', path);
  } else {
    //C: storing the result in a temporary variable
    var result = null;
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          if (exists === true){
            backend.get.bytes(path,function(err,data){
              //C: storing found and resolved path
              result = data;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          if (result == null){
            callback(new Exception('resource %s does not exist', path));
          } else {
            callback(null, result);
          }
        }
      }
    );
  }
};

//F: Gets read stream for file throughout the overlay abstract filesystem.
//A: path: Specifies the target file path.
//A: [callback(err,stream)]: Callback for async support. If missing, the function operates synchronously.
//A: [options]: Specifies options to be passed to fs.createReadStream.
//R: Returns read stream.
platform.io.get.stream = function(path,options,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true) {
        return backend.get.stream(path, options);
      }
    }
    var stream = native.stream.Writable();
    setTimeout(function () {
      stream.emit('error', new Exception('resource %s does not exist', path));
    });
    return stream;
  } else {
    //C: storing the result in a temporary variable
    var result = null;
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of result found or no more backends
        return (index < backends_length && result == null);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          if (exists === true){
            backend.get.stream(path,options,function(err,stream){
              //C: storing found and resolved path
              result = stream;
              internal_callback(err);
            });
          } else {
            internal_callback(null);
          }
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          if (result == null){
            var stream = native.stream.Writable();
            setTimeout(function () {
              stream.emit('error', new Exception('resource %s does not exist', path));
            });
            callback(null, stream);
          } else {
            callback(null, result);
          }
        }
      }
    );
  }
};

//F: Creates a file or directory if the path doesn't exist through the first backend.
//A: path: Specifies the target path (directory if it ends with '/').
//A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
platform.io.create = function(path,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.create(path);
  } else {
    backend.create(path,callback);
  }
};

//O: Provides set implementations.
platform.io.set = {};

//F: Sets data from string to file through the first backend (overwrites contents).
//A: path: Specifies the target file path.
//A: data: Specifies the data to be written, as string.
//A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
platform.io.set.string = function(path,data,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.set.string(path, data);
  } else {
    backend.set.string(path, data, callback);
  }
};

//F: Sets data from bytes (Buffer) to file through the first backend (overwrites contents).
//A: path: Specifies the target file path.
//A: data: Specifies the data to be written, as bytes (Buffer).
//A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
platform.io.set.bytes = function(path,data,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.set.bytes(path, data);
  } else {
    backend.set.bytes(path, data, callback);
  }
};

//F: Sets write stream for file through the first backend (overwrites contents).
//A: path: Specifies the target file path.
//A: [options]: Specifies options to be passed to fs.createWriteStream.
//A: [callback(err,stream)]: Callback for async support. If missing, the function operates synchronously.
platform.io.set.stream = function(path,options,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.set.stream(path, options);
  } else {
    backend.set.stream(path, options, callback);
  }
};

//F: Deletes a path through the first backend (file or directory).
//A: path: Specifies the target path.
//A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
platform.io.delete = function(path,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.delete(path);
  } else {
    backend.delete(path,callback);
  }
};

//F: Renames a path (file or directory) through the first backend.
//A: oldpath: Specifies the old target path.
//A: newpath: Specifies the new target path.
//A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
platform.io.rename = function(oldpath,newpath,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.rename(oldpath,newpath);
  } else {
    backend.rename(oldpath,newpath,callback);
  }
};

//F: Finds all files in a path through the first backend.
//A: path: Specifies the target path.
//A: [type]: Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
//A: [deep]: Specifies if search should be recursive. Default is false.
//A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
//A: [callback(err,result)]: Callback for async support (currently fake implementation). If missing, the function operates synchronously.
//R: Returns results as array of strings.
platform.io.list = function(path,type,deep,filter,callback){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    return backend.list(path,type,deep,filter);
  } else {
    backend.list(path,type,deep,filter,callback);
  }
};

//F: Resolves the path throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//A: [callback(err,fullpaths)]: Callback for async support. If missing, the function operates syncronously.
//R: Returns all valid absolute overlay paths as array of strings.
platform.io.resolveAll = function(path,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;
  var result = {};

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true) {
        result[backend.name] = native.path.join(backend.base, path);
      }
    }
    return result;
  } else {
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of no more backends
        return (index < backends_length);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.exist(path,function(exists){
          if (exists === true){
            //C: storing found and resolved path
            result[backend.name] = native.path.join(backend.base,path);
          }
          internal_callback(null);
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          callback(null,result);
        }
      }
    );
  }
};

//F: Finds all files in a path throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//A: [type]: Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
//A: [deep]: Specifies if search should be recursive. Default is false.
//A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
//A: [callback(err,results)]: Callback for async support (currently fake implementation). If missing, the function operates synchronously.
//R: Returns results as object with backend name as properties and array of strings as values.
platform.io.listAll = function(path,type,deep,filter,callback){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var backends_length = backends.length;
  var index;
  var backend;
  var result = {};

  //C: detecting if operate asynchronously or synchronously
  if (typeof callback !== 'function') {
    //C: cycling for all backends
    for (index = 0; index < backends_length; index++) {
      backend = backends[index];
      //C: detecting if path exists in current backend
      if (backend.exist(path) === true){
        result[backend.name] = backend.list(path,deep,filter);
      }
    }
    return result;
  } else {
    //C: storing the index of current backend, will be incremented later
    index = -1;
    native.async.whilst(
      function(){
        //C: moving to the next backend
        index++;
        //C: checking if iteration should stopped because of no more backends
        return (index < backends_length);
      },
      function(internal_callback) {
        //C: getting current backend
        backend = backends[index];
        //C: checking if file exists in current backend
        backend.list(path,type,deep,filter,function(err,files){
          if (err){
            internal_callback(err);
          } else {
            //C: storing found entries
            result[backend.name] = files;
            internal_callback(null);
          }
        });
      },
      function(err){
        //C: checking if any error occurred
        if (err) {
          callback(err);
        } else {
          //C: invoking the callback with the result
          callback(null,result);
        }
      }
    );
  }
};

platform.io.store.register('system',platform.kernel.new('core.io.store.file',[ '/' ]),-1);
platform.io.system = platform.io.store.getByName('system');

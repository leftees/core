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
 * Constructor for filesystem-based IO store backend.
*/
var filesystem_backend = function(root) {

  // storing filesystem root for this backend
  var base = root;
  // normalizing through natives
  base = native.path.normalize(base);

  /**
   *  Stores the name of the backend (set by platform.io.store.register).
  */
  this.name = null;

  /**
   *  Stores the root path for this backend.
  */
  //TODO: choose to protect from external change
  this.base = base;

  /**
  * Checks whether path exist (file or directory).
  * @param {} path Specifies the target path.
  * @param {} [callback(exists)] Callback for async support. If missing, the function operates syncronously.
  * @return {} Returns true or false.
 * @alert  Implementation is based on native.fs.exists.
  */
  this.exists = function(path, callback) {

    callback = native.util.makeHybridCallbackPromise(callback,true);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.exists(fullpath,function(exists){
      callback.resolve(exists);
    });

    return callback.promise;
  };

  /**
  * Checks whether path exist (file or directory).
  * @param {} path Specifies the target path.
  * @return {} Returns true or false.
 * @alert  Implementation is based on native.fs.exists.
  */
  this.existsSync = function(path) {
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.existsSync(fullpath);
  };

  /**
  * Gets info for path (file or directory).
  * @param {} path Specifies the target path.
  * @param {} [callback(err,stats)] Callback for async support. If missing, the function operates synchronously.
  * @return {} Returns fs.Stats class.
 * @alert  Implementation is based on native.fs.stat.
  */
  this.info = function(path,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.stat(fullpath,function(error,result){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });

    return callback.promise;
  };

  /**
  * Gets info for path (file or directory).
  * @param {} path Specifies the target path.
  * @return {} Returns fs.Stats class.
 * @alert  Implementation is based on native.fs.stat.
  */
  this.infoSync = function(path){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.statSync(fullpath);
  };

  /**
  * Provides get implementations.
 * @type {Object}
*/
  this.get = {};

  /**
  * Gets whole data as string from file.
  * @param {} path Specifies the target file path.
  * @param {} [callback(err,data)] Callback for async support. If missing, the function operates synchronously.
  * @return {} Returns data as string.
 * @alert  Implementation is based on native.fs.readFile with UTF-8 encoding.
  */
  this.get.string = function(path,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.readFile(fullpath,'utf8',function(error,result){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });

    return callback.promise;
  };

  /**
  * Gets whole data as string from file.
  * @param {} path Specifies the target file path.
  * @return {} Returns data as string.
 * @alert  Implementation is based on native.fs.readFile with UTF-8 encoding.
  */
  this.get.stringSync = function(path){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.readFileSync(fullpath,'utf8');
  };

  /**
  * Gets whole data as bytes (Buffer) from file.
  * @param {} path Specifies the target file path.
  * @param {} [callback(err,data)] Callback for async support. If missing, the function operates synchronously.
  * @return {} Returns data as bytes (Buffer).
 * @alert  Implementation is based on native.fs.readFile with no encoding.
  */
  this.get.bytes = function(path,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.readFile(fullpath,null,function(error,result){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });

    return callback.promise;
  };

  /**
  * Gets whole data as bytes (Buffer) from file.
  * @param {} path Specifies the target file path.
  * @return {} Returns data as bytes (Buffer).
 * @alert  Implementation is based on native.fs.readFile with no encoding.
  */
  this.get.bytesSync = function(path){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.readFileSync(fullpath,null);
  };

  /**
  * Gets read stream for file.
  * @param {} path Specifies the target file path.
  * @param {} [options] Specifies options to be passed to fs.createReadStream.
  * @param {} [callback(err,stream)] Callback for async support. If missing, the function operates synchronously.
  * @return {} Returns read stream.
 * @alert  Implementation is based on native.fs.createReadStream.
  */
  this.get.stream = function(path,options,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    // creating stream
    try {
      var newstream = native.fs.createReadStream(fullpath, options);
      newstream.on('error', function (err) {
        callback.reject(err);
      });
      newstream.on('readable', function () {
        newstream.removeAllListeners('error');
        newstream.removeAllListeners('readable');
        callback.resolve(newstream);
        newstream.emit('readable');
      });
    } catch (err) {
      callback.reject(err);
    }

    return callback.promise;
  };

  /**
  * Gets read stream for file.
  * @param {} path Specifies the target file path.
  * @param {} [options] Specifies options to be passed to fs.createReadStream.
  * @return {} Returns read stream.
 * @alert  Implementation is based on native.fs.createReadStream.
  */
  this.get.streamSync = function(path,options){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    // creating stream
    try {
      var newstream = native.fs.createReadStream(fullpath, options);
      return newstream;
    } catch (error) {
      throw error;
    }
  };

  /**
  * Creates a file or directory if the path doesn't exist.
  * @param {} path Specifies the target path (directory if it ends with '/').
  * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
 * @alert  Implementation is based on native.fs.ensureFile or native.fs.ensureDir (fs-extra) with no encoding.
  */
  this.create = function(path,callback) {

    callback = native.util.makeHybridCallbackPromise(callback);

    // detecting if a directory should be created instead of file
    var directory = (path.charAt(path.length-1) === native.path.sep);
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    if (directory === true) {
      return native.fs.ensureDir(fullpath,function(error,result){
        if (error) {
          callback.reject(error);
        } else {
          callback.resolve(result);
        }
      });
    } else {
      return native.fs.ensureFile(fullpath,function(){
        callback.resolve(fullpath);
      });
    }

    return callback.promise;
  };

  /**
  * Creates a file or directory if the path doesn't exist.
  * @param {} path Specifies the target path (directory if it ends with '/').
 * @alert  Implementation is based on native.fs.ensureFile or native.fs.ensureDir (fs-extra) with no encoding.
  */
  this.createSync = function(path) {
    // detecting if a directory should be created instead of file
    var directory = (path.charAt(path.length-1) === native.path.sep);
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    if (directory === true) {
      return native.fs.ensureDirSync(fullpath);
    } else {
      native.fs.ensureFileSync(fullpath);
      return fullpath;
    }
  };

  /**
  * Provides set implementations.
 * @type {Object}
*/
  this.set = {};

  /**
  * Sets data from string to file (overwrites contents).
  * @param {} path Specifies the target file path.
  * @param {} data Specifies the data to be written, as string.
  * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
 * @alert  Implementation is based on native.fs.outputFile (fs-extra) with UTF-8 encoding.
  */
  this.set.string = function(path,data,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.outputFile(fullpath,data,'utf8',function(error,result){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });

    return callback.promise;
  };

  /**
  * Sets data from string to file (overwrites contents).
  * @param {} path Specifies the target file path.
  * @param {} data Specifies the data to be written, as string.
 * @alert  Implementation is based on native.fs.outputFile (fs-extra) with UTF-8 encoding.
  */
  this.set.stringSync = function(path,data){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.outputFileSync(fullpath,data,'utf8');
  };

  /**
  * Sets data from bytes (Buffer) to file (overwrites contents).
  * @param {} path Specifies the target file path.
  * @param {} data Specifies the data to be written, as bytes (Buffer).
  * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
 * @alert  Implementation is based on native.fs.outputFile (fs-extra) with no encoding.
  */
  this.set.bytes = function(path,data,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.outputFile(fullpath,data,null,function(error,result){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });

    return callback.promise;
  };

  /**
  * Sets data from bytes (Buffer) to file (overwrites contents).
  * @param {} path Specifies the target file path.
  * @param {} data Specifies the data to be written, as bytes (Buffer).
 * @alert  Implementation is based on native.fs.outputFile (fs-extra) with no encoding.
  */
  this.set.bytesSync = function(path,data){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.outputFileSync(fullpath,data,null);
  };

  /**
  * Sets write stream for file (overwrites contents).
  * @param {} path Specifies the target file path.
  * @param {} [options] Specifies options to be passed to fs.createWriteStream.
  * @param {} [callback(err,stream)] Callback for async support. If missing, the function operates synchronously.
 * @alert  Implementation is based on native.fs.createWriteStream.
  */
  this.set.stream = function(path,options,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    // creating stream
    try {
      var newstream = native.fs.createWriteStream(fullpath,options);
      newstream.on('error', function (err) {
        callback.reject(err);
      });
      newstream.on('open', function () {
        newstream.removeAllListeners('error');
        newstream.removeAllListeners('open');
        callback.resolve(newstream);
        newstream.emit('open');
      });
    } catch (err) {
      callback.reject(err);
    }

    return callback.promise;
  };

  /**
  * Sets write stream for file (overwrites contents).
  * @param {} path Specifies the target file path.
  * @param {} [options] Specifies options to be passed to fs.createWriteStream.
 * @alert  Implementation is based on native.fs.createWriteStream.
  */
  this.set.streamSync = function(path,options){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    // creating stream
    try {
      var newstream = native.fs.createWriteStream(fullpath,options);
      return newstream;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Deletes a path (file or directory).
   * @function delete
   * @param {} path Specifies the target path.
   * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
   * @alert  Implementation is based on native.fs.remove (fs-extra through rm -rf).
  */
  this.delete = function(path,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    native.fs.remove(fullpath,callback);

    return callback.promise;
  };

  /**
  * Deletes a path (file or directory).
  * @param {} path Specifies the target path.
 * @alert  Implementation is based on native.fs.remove (fs-extra through rm -rf).
  */
  this.deleteSync = function(path){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    return native.fs.removeSync(fullpath);
  };

  /**
  * Renames a path (file or directory).
  * @param {} oldpath Specifies the old target path.
  * @param {} newpath Specifies the new target path.
  * @param {} [callback(err)] Callback for async support. If missing, the function operates synchronously.
 * @alert  Implementation is based on native.fs.rename.
  */
  this.rename = function(oldpath,newpath,callback){

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping paths to base root of current instance
    var oldfullpath = native.path.join(base,oldpath);
    var newfullpath = native.path.join(base,newpath);
    native.fs.rename(oldfullpath,newfullpath,function(error,result){
      if (error) {
        callback.reject(error);
      } else {
        callback.resolve(result);
      }
    });

    return callback.promise;
  };

  /**
  * Renames a path (file or directory).
  * @param {} oldpath Specifies the old target path.
  * @param {} newpath Specifies the new target path.
 * @alert  Implementation is based on native.fs.rename.
  */
  this.renameSync = function(oldpath,newpath){
    // mapping paths to base root of current instance
    var oldfullpath = native.path.join(base,oldpath);
    var newfullpath = native.path.join(base,newpath);
    return native.fs.renameSync(oldfullpath,newfullpath);
  };

  /**
  * Finds all files in a path (async implementation).
  * @param {} path Specifies the target path.
  * @param {} [type] Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
  * @param {} [deep] Specifies if search should be recursive. Default is false.
  * @param {} [filter] Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
  * @param {} [callback(err,result)] Callback for async support (currently fake implementation). If missing, the function operates synchronously.
  * @return {} Returns results as array of strings.
  */
  this.list = function(path,type,deep,filter,callback) {

    callback = native.util.makeHybridCallbackPromise(callback);

    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    // checking whether search path exists
    native.fs.exists(fullpath,function(exists){
      if (exists === false) {
        // simulating ENOENT error
        var error = new Error('no such file or directory \''+path+'\'');
        error.errno = -2;
        error.code = 'ENOENT';
        error.path = fullpath;
        error.syscall = 'stat';
        callback.reject(error);
      } else {
        var result = [];
        var error_occurred = false;
        // creating a readdirp streamed walker
        var walker = native.fs.readdirp({
          root: fullpath,
          fileFilter: filter,
          directoryFilter: filter,
          depth: (deep === true) ? undefined : 0,
          entryType: type,
          lstat: false
        });
        // attaching to new entry found event
        walker.on('data',function(entry){
          // adding entry to results (only the path relative to the search root)
          result.push(entry.path);
        });
        // attaching to error event
        walker.on('error',function(error){
          // storing error prevent duplicated callback call with partial results
          error_occurred = true;
          callback.reject(error);
        });
        // attaching to search end event
        walker.on('end',function(){
          // invoking callback with results if no error occurred
          if (error_occurred === false){
            callback.resolve(result);
          }
        });
      }
    });

    return callback.promise;
  };

  /**
  * Finds all files in a path (sync implementation).
  * @param {} path Specifies the target path.
  * @param {} [type] Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
  * @param {} [deep] Specifies if search should be recursive. Default is false.
  * @param {} [filter] Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
  * @return {} Returns results as array of strings.
  */
  this.listSync = function(path,type,deep,filter){
    // mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    // checking whether search path exists
    if (native.fs.existsSync(fullpath) === false) {
      // simulating ENOENT error
      var error = new Error('no such file or directory \''+path+'\'');
      error.errno = -2;
      error.code = 'ENOENT';
      error.path = fullpath;
      error.syscall = 'stat';
      throw error;
    }
    // creating empty result array
    var result = [];
    // executing recursive call to reduce stack
    platform.utility.recursiveCallV(function(curpath,result){
      // creating empty array for nested levels
      var pending = [];
      // listing current path children
      var files = native.fs.readdirSync(curpath);
      // processing current path children
      files.forEach(function(file){
        // getting absolute path
        var filename = curpath+native.path.sep+file;
        // getting file stats
        var filestat = native.fs.statSync(filename);
        // detecting directory for nested levels
        if (deep === true && filestat.isDirectory() === true) {
          // queueing directory to nested levels if recursive search requested (filter not applied)
          if(deep === true) {
            pending.push(filename);
          }
        }
        // skipping/filtering by type
        switch(type) {
          case 'directories':
            if(filestat.isDirectory() === false) {
              return;
            }
          case 'both':
            if(filestat.isDirectory() === false && filestat.isFile() === false) {
              return;
            }
          case 'all':
            break;
          case 'files':
          default:
            if(filestat.isFile() === false) {
              return;
            }
        }
        // getting relative path to search path
        var fileresult = filename.replace(fullpath+native.path.sep,'');
        // applies filters if any
        if (filter != null) {
          // detecting array of filters
          if (filter.constructor === Array){
            // applying filters
            var matches = false;
            filter.forEach(function(filter_child){
              if (native.match.mini(fileresult,filter_child) === true) {
                matches = true;
              }
            });
            if (matches === false) {
              return;
            }
          } else {
            // applying single filter
            if (native.match.mini(fileresult,filter) === false) {
              return;
            }
          }
        }
        // pushing file to result array (relative to search path)
        result.push(fileresult);
      });
      // returning nested children to be search into
      return pending;
    },null,fullpath,result);
    return result;
  };

  this.createSync('/');

};

// registering 'core.io.store.file' to global classes
platform.classes.register('core.io.store.file',filesystem_backend,true);
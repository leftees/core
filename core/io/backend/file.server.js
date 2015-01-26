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

//F: Constructor for filesystem-based IO store backend.
var filesystem_backend = function(root) {

  //C: storing filesystem root for this backend
  var base = root;
  //C: normalizing through natives
  base = native.path.normalize(base);

  //V: Stores the name of the backend (set by platform.io.store.register).
  this.name = null;

  //V: Stores the root path for this backend.
  //T: choose to protect from external change
  this.base = base;

  //F: Checks whether path exist (file or directory).
  //A: path: Specifies the target path.
  //A: [callback(exists)]: Callback for async support. If missing, the function operates syncronously.
  //R: Returns true or false.
  //H: Implementation is based on native.fs.exists.
  this.exists = function(path, callback) {
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.existsSync(fullpath);
    } else {
      return native.fs.exists(fullpath,callback);
    }
  };

  //F: Gets info for path (file or directory).
  //A: path: Specifies the target path.
  //A: [callback(err,stats)]: Callback for async support. If missing, the function operates synchronously.
  //R: Returns fs.Stats class.
  //H: Implementation is based on native.fs.stat.
  this.info = function(path,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.statSync(fullpath);
    } else {
      return native.fs.stat(fullpath,callback);
    }
  };

  //O: Provides get implementations.
  this.get = {};

  //F: Gets whole data as string from file.
  //A: path: Specifies the target file path.
  //A: [callback(err,data)]: Callback for async support. If missing, the function operates synchronously.
  //R: Returns data as string.
  //H: Implementation is based on native.fs.readFile with UTF-8 encoding.
  this.get.string = function(path,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.readFileSync(fullpath,'utf8');
    } else {
      return native.fs.readFile(fullpath,'utf8',callback);
    }
  };

  //F: Gets whole data as bytes (Buffer) from file.
  //A: path: Specifies the target file path.
  //A: [callback(err,data)]: Callback for async support. If missing, the function operates synchronously.
  //R: Returns data as bytes (Buffer).
  //H: Implementation is based on native.fs.readFile with no encoding.
  this.get.bytes = function(path,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.readFileSync(fullpath,null);
    } else {
      return native.fs.readFile(fullpath,null,callback);
    }
  };

  //F: Gets read stream for file.
  //A: path: Specifies the target file path.
  //A: [options]: Specifies options to be passed to fs.createReadStream.
  //A: [callback(err,stream)]: Callback for async support. If missing, the function operates synchronously.
  //R: Returns read stream.
  //H: Implementation is based on native.fs.createReadStream.
  this.get.stream = function(path,options,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: creating stream
    try {
      var newstream = native.fs.createReadStream(fullpath, options);
      //C: detecting if operate asynchronously or synchronously
      if (typeof callback !== 'function') {
        return newstream;
      } else {
        newstream.on('error', function (err) {
          callback(err);
        });
        newstream.on('readable', function () {
          newstream.removeAllListeners('error');
          newstream.removeAllListeners('readable');
          callback (null, newstream);
          newstream.emit('readable');
        });
      }
    } catch (err) {
      //C: detecting if operate asynchronously or synchronously
      if (typeof callback !== 'function') {
        throw err;
      } else {
        callback(err);
      }
    }
  };

  //F: Creates a file or directory if the path doesn't exist.
  //A: path: Specifies the target path (directory if it ends with '/').
  //A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
  //H: Implementation is based on native.fs.ensureFile or native.fs.ensureDir (fs-extra) with no encoding.
  this.create = function(path,callback) {
    //C: detecting if a directory should be created instead of file
    var directory = (path.charAt(path.length-1) === native.path.sep);
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      if (directory === true) {
        return native.fs.ensureDirSync(fullpath);
      } else {
        native.fs.ensureFileSync(fullpath);
        return fullpath;
      }
    } else {
      if (directory === true) {
        return native.fs.ensureDir(fullpath,callback);
      } else {
        return native.fs.ensureFile(fullpath,function(){
          callback(null,fullpath);
        });
      }
    }
  };

  //O: Provides set implementations.
  this.set = {};

  //F: Sets data from string to file (overwrites contents).
  //A: path: Specifies the target file path.
  //A: data: Specifies the data to be written, as string.
  //A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
  //H: Implementation is based on native.fs.outputFile (fs-extra) with UTF-8 encoding.
  this.set.string = function(path,data,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.outputFileSync(fullpath,data,'utf8');
    } else {
      return native.fs.outputFile(fullpath,data,'utf8',callback);
    }
  };

  //F: Sets data from bytes (Buffer) to file (overwrites contents).
  //A: path: Specifies the target file path.
  //A: data: Specifies the data to be written, as bytes (Buffer).
  //A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
  //H: Implementation is based on native.fs.outputFile (fs-extra) with no encoding.
  this.set.bytes = function(path,data,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.outputFileSync(fullpath,data,null);
    } else {
      return native.fs.outputFile(fullpath,data,null,callback);
    }
  };

  //F: Sets write stream for file (overwrites contents).
  //A: path: Specifies the target file path.
  //A: [options]: Specifies options to be passed to fs.createWriteStream.
  //A: [callback(err,stream)]: Callback for async support. If missing, the function operates synchronously.
  //H: Implementation is based on native.fs.createWriteStream.
  this.set.stream = function(path,options,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: creating stream
    try {
      var newstream = native.fs.createWriteStream(fullpath,options);
      //C: detecting if operate asynchronously or synchronously
      if (typeof callback !== 'function') {
        return newstream;
      } else {
        newstream.on('error', function (err) {
          callback(err);
        });
        newstream.on('open', function () {
          newstream.removeAllListeners('error');
          newstream.removeAllListeners('open');
          callback (null, newstream);
          newstream.emit('open');
        });
      }
    } catch (err) {
      //C: detecting if operate asynchronously or synchronously
      if (typeof callback !== 'function') {
        throw err;
      } else {
        callback(err);
      }
    }
  };

  //F: Deletes a path (file or directory).
  //A: path: Specifies the target path.
  //A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
  //H: Implementation is based on native.fs.remove (fs-extra through rm -rf).
  this.delete = function(path,callback){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.removeSync(fullpath);
    } else {
      return native.fs.remove(fullpath,callback);
    }
  };

  //F: Renames a path (file or directory).
  //A: oldpath: Specifies the old target path.
  //A: newpath: Specifies the new target path.
  //A: [callback(err)]: Callback for async support. If missing, the function operates synchronously.
  //H: Implementation is based on native.fs.rename.
  this.rename = function(oldpath,newpath,callback){
    //C: mapping paths to base root of current instance
    var oldfullpath = native.path.join(base,oldpath);
    var newfullpath = native.path.join(base,newpath);
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return native.fs.renameSync(oldfullpath,newfullpath);
    } else {
      return native.fs.rename(oldfullpath,newfullpath,callback);
    }
  };

  //F: Finds all files in a path.
  //A: path: Specifies the target path.
  //A: [type]: Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
  //A: [deep]: Specifies if search should be recursive. Default is false.
  //A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
  //A: [callback(err,result)]: Callback for async support (currently fake implementation). If missing, the function operates synchronously.
  //R: Returns results as array of strings.
  this.list = function(path,type,deep,filter,callback) {
    //C: detecting if operate asynchronously or synchronously
    if (typeof callback !== 'function') {
      return _listSync(path,type,deep,filter);
    } else {
      _listAsync(path,type,deep,filter,callback);
    }
  };

  //F: Finds all files in a path (sync implementation).
  //A: path: Specifies the target path.
  //A: [type]: Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
  //A: [deep]: Specifies if search should be recursive. Default is false.
  //A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
  //R: Returns results as array of strings.
  var _listSync = function(path,type,deep,filter){
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: checking whether search path exists
    if (native.fs.existsSync(fullpath) === false) {
      //C: simulating ENOENT error
      var error = new Error('no such file or directory \''+path+'\'');
      error.errno = -2;
      error.code = 'ENOENT';
      error.path = fullpath;
      error.syscall = 'stat';
      throw error;
    }
    //C: initializing minimatch class for filter
    var minimatch;
    if (filter != null) {
      minimatch = require("minimatch");
    }
    //C: creating empty result array
    var result = [];
    //C: executing recursive call to reduce stack
    platform.utility.recursiveCallV(function(curpath,result){
      //C: creating empty array for nested levels
      var pending = [];
      //C: listing current path children
      var files = native.fs.readdirSync(curpath);
      //C: processing current path children
      files.forEach(function(file){
        //C: getting absolute path
        var filename = curpath+native.path.sep+file;
        //C: getting file stats
        var filestat = native.fs.statSync(filename);
        //C: detecting directory for nested levels
        if (deep === true && filestat.isDirectory() === true) {
          //C: queueing directory to nested levels if recursive search requested (filter not applied)
          if(deep === true) {
            pending.push(filename);
          }
        }
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
        //C: getting relative path to search path
        var fileresult = filename.replace(fullpath+native.path.sep,'');
        //C: applies filters if any
        if (filter != null) {
          //C: detecting array of filters
          if (filter.constructor === Array){
            //C: applying filters
            var matches = false;
            filter.forEach(function(filter_child){
              if (minimatch(fileresult,filter_child) === true) {
                matches = true;
              }
            });
            if (matches === false) {
              return;
            }
          } else {
            //C: applying single filter
            if (minimatch(fileresult,filter) === false) {
              return;
            }
          }
        }
        //C: pushing file to result array (relative to search path)
        result.push(fileresult);
      });
      //C: returning nested children to be search into
      return pending;
    },null,fullpath,result);
    return result;
  };

  //F: Finds all files in a path (async implementation).
  //A: path: Specifies the target path.
  //A: [type]: Specifies what type of entries should be listed as string ('directories','files','both','all'). Default is 'files'.
  //A: [deep]: Specifies if search should be recursive. Default is false.
  //A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
  //A: [callback(err,result)]: Callback for async support (currently fake implementation). If missing, the function operates synchronously.
  //R: Returns results as array of strings.
  var _listAsync = function(path,type,deep,filter,callback) {
    //C: mapping path to base root of current instance
    var fullpath = native.path.join(base,path||'');
    //C: checking whether search path exists
    native.fs.exists(fullpath,function(exists){
      if (exists === false) {
        //C: simulating ENOENT error
        var error = new Error('no such file or directory \''+path+'\'');
        error.errno = -2;
        error.code = 'ENOENT';
        error.path = fullpath;
        error.syscall = 'stat';
        callback(error);
      } else {
        var result = [];
        var error_occurred = false;
        //C: creating a readdirp streamed walker
        var walker = native.fs.readdirp({
          root: fullpath,
          fileFilter: filter,
          directoryFilter: filter,
          depth: (deep === true) ? undefined : 0,
          entryType: type,
          lstat: false
        });
        //C: attaching to new entry found event
        walker.on('data',function(entry){
          //C: adding entry to results (only the path relative to the search root)
          result.push(entry.path);
        });
        //C: attaching to error event
        walker.on('error',function(error){
          //C: storing error prevent duplicated callback call with partial results
          error_occurred = true;
          callback(error);
        });
        //C: attaching to search end event
        walker.on('end',function(){
          //C: invoking callback with results if no error occurred
          if (error_occurred === false){
            callback(null,result);
          }
        });
      }
    });
  };

  this.create('/');

};

//C: registering 'core.io.store.file' to global classes
platform.classes.register('core.io.store.file',filesystem_backend,true);
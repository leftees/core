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

//N: Provides IO helper with abstract filesystem and packaged module support.
platform.io = platform.io || {};

//T: implement iterator instead of forEach-ing list()

//F: Resolves the path throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//R: Returns the first valid absolute overlay path.
platform.io.resolve = function(path){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      return native.path.join(backend.base,path);
    }
  }
  return null;
};

//F: Checks whether path exist (file or directory) throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//R: Returns true or false.
platform.io.exist = function(path) {
  //C: getting backends by priority
  var backends = platform.io.store.list();
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      return true;
    }
  }
  return false;
};

//F: Gets info for path (file or directory) throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//R: Returns fs.Stats class.
platform.io.info = function(path){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      return backend.info(path);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

//O: Provides get implementations.
platform.io.get = {};

//F: Gets whole data as string from file throughout the overlay abstract filesystem.
//A: path: Specifies the target file path.
//R: Returns data as string.
platform.io.get.string = function(path){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      return backend.get.string(path);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

//F: Gets whole data as bytes (Buffer) from file throughout the overlay abstract filesystem.
//A: path: Specifies the target file path.
//R: Returns data as bytes (Buffer).
platform.io.get.bytes = function(path){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      return backend.get.bytes(path);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

//F: Gets read stream for file throughout the overlay abstract filesystem.
//A: path: Specifies the target file path.
//A: [options]: Specifies options to be passed to fs.createReadStream.
//R: Returns read stream.
platform.io.get.stream = function(path,options){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      return backend.get.stream(path,options);
    }
  }
  var stream = require('stream').Writable();
  setTimeout(function(){
    stream.emit('error',new Exception('resource \'%s\' does not exist',path));
  });
  return stream;

};

//F: Creates a file or directory if the path doesn't exist through the first backend.
//A: path: Specifies the target path (directory if it ends with '/').
platform.io.create = function(path){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.create(path);
};

//O: Provides set implementations.
platform.io.set = {};

//F: Sets data from string to file through the first backend (overwrites contents).
//A: path: Specifies the target file path.
//A: data: Specifies the data to be written, as string.
platform.io.set.string = function(path,data){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.set.string(path,data);
};

//F: Sets data from bytes (Buffer) to file through the first backend (overwrites contents).
//A: path: Specifies the target file path.
//A: data: Specifies the data to be written, as bytes (Buffer).
platform.io.set.bytes = function(path,data){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.set.bytes(path,data);
};

//F: Sets write stream for file through the first backend (overwrites contents).
//A: path: Specifies the target file path.
//A: [options]: Specifies options to be passed to fs.createWriteStream.
platform.io.set.stream = function(path,options){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.set.stream(path,options);
};

//F: Deletes a path through the first backend (file or directory).
//A: path: Specifies the target path.
platform.io.delete = function(path){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.delete(path);
};

//F: Renames a path (file or directory) through the first backend.
//A: oldpath: Specifies the old target path.
//A: newpath: Specifies the new target path.
platform.io.rename = function(oldpath,newpath){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.rename(oldpath,newpath);
};

//F: Finds all files in a path through the first backend.
//A: path: Specifies the target path.
//A: [deep]: Specifies if search should be recursive. Default is false.
//A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
//R: Returns results as array of strings.
platform.io.list = function(path,deep,filter){
  //C: getting first backend
  var backend = platform.io.store.getByPriority(0);
  return backend.list(path,deep,filter);
};

//F: Resolves the path throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//R: Returns all valid absolute overlay paths as array of strings.
platform.io.resolveAll = function(path){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var result = {};
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      result[backend.name] = native.path.join(backend.base,path);
    }
  }
  return result;
};

//F: Finds all files in a path throughout the overlay abstract filesystem.
//A: path: Specifies the target path.
//A: [deep]: Specifies if search should be recursive. Default is false.
//A: [filter]: Specifies filter, as string or strings array, to match results (based on minimatch). Default is null.
//R: Returns results as object with backend name as properties and array of strings as values.
platform.io.listAll = function(path,deep,filter){
  //C: getting backends by priority
  var backends = platform.io.store.list();
  var result = {};
  //C: cycling for all backends
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    //C: detecting if path exists in current backend
    if (backend.exist(path) === true){
      result[backend.name] = backend.list(path,deep,filter);
    }
  }
  return result;
};
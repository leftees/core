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

platform.io.resolve = function(path){
  var backends = platform.io.store.list();
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      return native.path.join(backend.base,path);
    }
  }
  return null;
};

platform.io.exist = function(path) {
  var backends = platform.io.store.list();
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      return true;
    }
  }
  return false;
};

platform.io.info = function(path){
  var backends = platform.io.store.list();
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      return backend.info(path);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

platform.io.get = {};
platform.io.get.string = function(path){
  var backends = platform.io.store.list();
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      return backend.get.string(path);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

platform.io.get.bytes = function(path){
  var backends = platform.io.store.list();
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      return backend.get.bytes(path);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

platform.io.get.stream = function(path,options){
  var backends = platform.io.store.list();
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      return backend.get.stream(path,options);
    }
  }
  throw new Exception('resource \'%s\' does not exist',path);
};

platform.io.create = function(path){
  var backend = platform.io.store.getByPriority(0);
  return backend.create(path);
};

platform.io.set = {};
platform.io.set.string = function(path,data){
  var backend = platform.io.store.getByPriority(0);
  return backend.set.string(path,data);
};

platform.io.set.bytes = function(path){
  var backend = platform.io.store.getByPriority(0);
  return backend.set.bytes(path,data);
};

platform.io.set.stream = function(path){
  var backend = platform.io.store.getByPriority(0);
  return backend.set.stream(path,options);
};

platform.io.delete = function(path){
  var backend = platform.io.store.getByPriority(0);
  return backend.delete(path);
};

platform.io.rename = function(oldpath,newpath){
  var backend = platform.io.store.getByPriority(0);
  return backend.rename(oldpath,newpath);
};

platform.io.list = function(path,deep,filter){
  var backend = platform.io.store.getByPriority(0);
  return backend.list(path,deep,filter);
};


platform.io.resolveAll = function(path){
  var backends = platform.io.store.list();
  var result = {};
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      result[backend.name] = native.path.join(backend.base,path);
    }
  }
  return result;
};

platform.io.listAll = function(path,deep,filter){
  var backends = platform.io.store.list();
  var result = {};
  for (var index = 0; index < backends.length; index++) {
    var backend = backends[index];
    if (backend.exist(path) === true){
      result[backend.name] = backend.list(path,deep,filter);
    }
  }
  return result;
};
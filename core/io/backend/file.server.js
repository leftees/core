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

var filesystem_backend = function(root) {

  //C: storing filesystem root for this backend
  var base = root;
  //C: normalizing through natives
  base = native.path.normalize(base);
  //C: adding leading slash
  if (base.charAt(0) !== native.path.sep) {
    base = native.path.sep + base;
  }

  this.base = base;

  this.exist = function(path, callback) {
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.existsSync(fullpath);
    } else {
      return native.fs.exists(fullpath,callback);
    }
  };

  this.info = function(path,callback){
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.statSync(fullpath);
    } else {
      return native.fs.stat(fullpath,callback);
    }
  };

  this.get = {};

  this.get.string = function(path,callback){
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.readFileSync(fullpath,'utf8');
    } else {
      return native.fs.readFile(fullpath,'utf8',callback);
    }
  };

  this.get.bytes = function(path,callback){
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.readFileSync(fullpath,null);
    } else {
      return native.fs.readFile(fullpath,null,callback);
    }
  };

  this.get.stream = function(path,options,callback){
    var fullpath = native.path.join(base,path||'');
    var newstream = native.fs.createReadStream(fullpath,options);
    if (callback === undefined || callback === null) {
      return newstream;
    } else {
      newstream.on('open',callback.bind(null,newstream));
      return;
    }
  };

  this.create = function(path,callback) {
    var directory = (path.charAt(path.length-1) === native.path.sep);
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      if (directory === true) {
        return native.fs.ensureDirSync(fullpath);
      } else {
        return native.fs.ensureFileSync(fullpath);
      }
    } else {
      if (directory === true) {
        return native.fs.ensureDir(fullpath,callback);
      } else {
        return native.fs.ensureFile(fullpath,callback);
      }
    }
  };

  this.set = {};

  this.set.string = function(path,data,callback){
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.outputFileSync(fullpath,data,'utf8');
    } else {
      return native.fs.outputFile(fullpath,data,'utf8',callback);
    }
  };

  this.set.bytes = function(path,data,callback){
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.outputFileSync(fullpath,data,null);
    } else {
      return native.fs.outputFile(fullpath,data,null,callback);
    }
  };

  this.set.stream = function(path,options,callback){
    var fullpath = native.path.join(base,path||'');
    var newstream = native.fs.createWriteStream(fullpath,options);
    if (callback === undefined || callback === null) {
      return newstream;
    } else {
      newstream.on('open',callback.bind(null,newstream));
      return;
    }
  };

  this.delete = function(path,callback){
    var fullpath = native.path.join(base,path||'');
    if (callback === undefined || callback === null) {
      return native.fs.removeSync(fullpath);
    } else {
      return native.fs.remove(fullpath,callback);
    }
  };

  this.rename = function(oldpath,newpath,callback){
    var oldfullpath = native.path.join(base,oldpath);
    var newfullpath = native.path.join(base,newpath);
    if (callback === undefined || callback === null) {
      return native.fs.renameSync(oldfullpath,newfullpath);
    } else {
      return native.fs.rename(oldfullpath,newfullpath,callback);
    }
  };

  this.list = function(path,deep,filter,callback){
    var fullpath = native.path.join(base,path||'');
    var minimatch = require("minimatch");
    var result = [];
    platform.utility.recursiveCall(function(curpath,result){
      var pending = [];
      var files = native.fs.readdirSync(curpath);
      files.forEach(function(file){
        var filename = curpath+native.path.sep+file;
        var fileresult = filename.replace(fullpath+native.path.sep,'');
        if (native.fs.statSync(filename).isDirectory() === true) {
          if(deep === true) {
            pending.push(filename);
          }
        } else {
          if (filter !== undefined && filter !== null) {
            if (filter.constructor === Array){
              var matches = true;
              filter.forEach(function(filter_child){
                if (minimatch(fileresult,filter_child) === false) {
                  matches = false;
                }
              });
              if (matches === false) {
                return;
              }
            } else {
              if (minimatch(fileresult,filter) === false) {
                return;
              }
            }
          }
          result.push(fileresult);
        }
      });
      return pending;
    },function(result){
      if (callback !== undefined && callback !== null) {
        callback(result);
      }
    },fullpath,result);
    return result;
  };
};

platform.classes.register('core.io.store.file',filesystem_backend);
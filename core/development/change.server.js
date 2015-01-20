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

//T: MISSING CODE DOCUMENTATION
platform.development.change = platform.development.change || {};

//T: MISSING CODE DOCUMENTATION
platform.development.change.process = function(file){
  var type;
  if (platform.io.system.exist(file) === true) {
    type = 'change';
  } else {
    type = 'delete';
  }

  //T: MISSING CODE DOCUMENTATION
  var path = file.replace(platform.runtime.path.core,'');
  var file_is_loaded = platform.environment._files.indexOf(path);
  if((file_is_loaded > -1 && platform.configuration.server.debugging.filesystem.change.loaded === true)
    || (file_is_loaded === -1 && platform.configuration.server.debugging.filesystem.change.other === true)) {
    console.debug('file %s %sd', path, type);
  }

  if (file_is_loaded > -1) {
    platform.development.change.process[type](path);
  }
};

//T: MISSING CODE DOCUMENTATION
platform.development.change.process.change = function(path){
  return;
  if(platform.io.cache.was(path,'built') === true){
    var old_data = platform.io.cache.got.string(path,'built');
    var new_data = platform.io.get.string(path);
    console.log(_compute_change(old_data,new_data));
  }
};

//T: MISSING CODE DOCUMENTATION
platform.development.change.process.delete = function(path){

};

//T: MISSING CODE DOCUMENTATION
var _compute_change = function(old_data, new_data){
  var old_split_data = old_data.split('\n');
  var new_split_data = new_data.split('\n');

  var old_split_hash = old_split_data.map(function(line){
    return String.hash.jenkins(line);
  });
  var new_split_hash = new_split_data.map(function(line){
    return String.hash.jenkins(line);
  });

  var leftovers = [];

  old_split_hash = old_split_hash.filter(function(old_hash){
    var new_index = new_split_hash.indexOf(old_hash);
    if (new_index > -1) {
      new_split_hash.splice(new_index,1);
      return false;
    } else {
      return true;
    }
  });

  return {
    'remove': old_split_data,
    'add': new_split_data
  };
};

//T: MISSING CODE DOCUMENTATION
if (platform.runtime.development === true) {
  //T: activate on platform ready event
  native.watch(platform.runtime.path.core, platform.development.change.process);
}

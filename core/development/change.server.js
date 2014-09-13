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

platform.development.change = platform.development.change || {};

platform.development.change._watcher = null;

platform.development.change.process = function(path){
  var type;
  if (platform.io.system.exist(path) === true) {
    type = 'change';
  } else {
    type = 'delete';
  }

  platform.development.change.process[type](path);

  var file_is_loaded = platform.environment._files.indexOf(path);
  if((file_is_loaded > -1 && platform.configuration.server.debugging.filesystem.change.loaded === true)
    || (file_is_loaded === -1 && platform.configuration.server.debugging.filesystem.change.other === true)) {
    console.debug('filesystem %s %sd', path, type);
  }
};

platform.development.change.process.change = function(path){

};

platform.development.change.process.delete = function(path){

};

if (platform.runtime.development === true) {
  //T: activate on platform ready event
  native.watch(platform.runtime.path.core, platform.development.change.process);
}

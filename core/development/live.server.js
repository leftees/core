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

//TODO: MISSING CODE DOCUMENTATION
/**
 * test
 * @type {object}
 */
platform.development.change = platform.development.change || {};

platform.development.change._store = platform.development.change._store || {};

platform.development.change.register = function(files,node_id){
  if (node_id == null){
    node_id = 'core';
  }
  if (Array.isArray(files) === true) {
    files.forEach(function(file){
      platform.development.change.register(file,node_id);
    });
  } else {
    platform.development.change._store[files] = platform.development.change._store[files] || [];
    if (platform.development.change._store[files].indexOf(node_id) === -1) {
      platform.development.change._store[files].push(node_id);
    }
  }
};

platform.development.change.unregister = function(files,node_id){
  if (node_id == null){
    node_id = 'core';
  }
  if (Array.isArray(files) === true) {
    files.forEach(function(file){
      platform.development.change.unregister(file,node_id);
    });
  } else {
    if (platform.development.change._store.hasOwnProperty(files) === true){
      var node_id_index = platform.development.change._store[files].indexOf(id);
      if (node_id_index !== -1) {
        platform.development.change._store[files].splice(node_id_index, 1);
      }
      if (platform.development.change._store[files].length === 0){
        delete platform.development.change._store[files];
      }
    }
  }
};

platform.development.change._regexp_skip = /^\/{0,1}(build|cache|data|log|tmp)/gi;

//TODO: MISSING CODE DOCUMENTATION
platform.development.change.process = function(backend,file){
  var path = file.replace(backend.base,'');
  if (platform.development.change._regexp_skip.test(path) && (platform.development.change._regexp_skip.lastIndex = 0) === 0) {
    return;
  }
  var type;
  if (platform.io.backends.system.existsSync(file) === true) {
    type = 'change';
  } else {
    type = 'delete';
  }

  //TODO: MISSING CODE DOCUMENTATION
  var file_is_loaded = platform.development.change._store.hasOwnProperty(file);
  if((file_is_loaded === true && platform.configuration.debug.filesystem.change.loaded === true)
    || (file_is_loaded === true && platform.configuration.debug.filesystem.change.other === true)) {
    console.debug('file %s %sd', file, type);
  }

  if (file_is_loaded === true) {
    platform.development.change.process[type](path,file,backend);
  }
};

//TODO: MISSING CODE DOCUMENTATION
platform.development.change.process.change = async function(path, file, backend){
  await platform.io.cache.unset(path);
};

//TODO: MISSING CODE DOCUMENTATION
platform.development.change.process.delete = async function(path, file, backend){
  await platform.io.cache.unset(path);
};

//TODO: MISSING CODE DOCUMENTATION
if (platform.state !== platform._states.PRELOAD) {
  if (platform.configuration.runtime.development === true) {
    platform.events.attach('application.ready', 'change.watcher.init', function () {

      if (process.env.BUILD === 'pack') return;

      var skip_root_core = false;
      if (platform.io.backends.root.base === platform.io.backends.core.base) {
        skip_root_core = true;
      }
      platform.io.store.list().forEach(function (backend) {
        if (skip_root_core === true && backend.name === 'root') {
          return;
        }
        var backend_priority = platform.io.store.getPriority(backend.name);
        if (backend_priority > -1 && backend_priority < 100) {
          //TODO: avoid watching on temporary or external folders (e.g. node_modules)
          //FIXME: causes EMFILE exception in darwin platform (probably because of watching huge node_modules folder) 
          native.watch(backend.base, platform.development.change.process.bind(null, backend));
        }
      });
    });
  }
}

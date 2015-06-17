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

//TODO: reimplement with event support to allow multiple 'compile' nodes

/**
 * Provides kernel functions to execute and manage environment.
 * @namespace
*/
platform.kernel = platform.kernel || {};

if(platform.cluster.worker.role !== 'compile') {

  platform.kernel.preprocess = async function (path, module, code) {
    return await platform.cluster.kernel.invoke('compile', 'platform.kernel.preprocess', [path, module, code]);
  };

  platform.kernel.inject = async function (code, file, module, preprocess) {
    var preprocessed_code;
    if (preprocess === true) {
      preprocessed_code = await platform.kernel.preprocess(file, module, code);
    } else {
      preprocessed_code = native.eval(code);
    }
    return global.eval.call(global, preprocessed_code);
  };

  platform.kernel.load = async function (path, module) {
    var resolved_path_object = await platform.io.resolve(path);
    // checking whether the file exists
    if (resolved_path_object == null) {
      throw new Exception('resource %s not found', path);
    }
    // detecting if file is already cached
    var is_cached = platform.io.cache.isCachedSync(path, 'built');
    if (is_cached === false) {
      await platform.kernel.preprocess(path, module);
    }
    // registering for file changes
    var fullpath = resolved_path_object.fullpath;
    if (platform.configuration.debug.load === true) {
      //console.info('loading %s', resolved_path_object.shortpath);
      console.info('loading %s from %s (%s)', resolved_path_object.shortpath, resolved_path_object.backend.name, resolved_path_object.fullpath);
    }
    await platform.cluster.kernel.invoke('compile', 'platform.development.change.register', [fullpath, platform.cluster.worker.id]);
    // loading file through require
    var path_to_load = native.path.join(platform.io.backends.build.base, path);
    var exported = global.require(path_to_load + ((global.development === false) ? '.min' : ''));
    // invalidating main file from require cache
    delete global.require.cache[path_to_load];
    try {
      await exported.__promise_;
      delete exported.__promise_;
      return exported;
    } catch(err) {
      throw err;
    }
  };

}

// registering 'build' store as new filesystem backend with server root path + /runtime/
//TODO: allow build store override by configuration
platform.io.store.register('build', platform.kernel.new('core.io.store.file', [native.path.join(platform.configuration.runtime.path.root, 'build')]), -1, true);

/**
 * Contains cluster namespace with related objects and methods.
 * @namespace
 */
platform.cluster = platform.cluster || {};

/**
 * Contains cluster remote kernel helper methods.
 * @type {Object}
 */
platform.cluster.kernel = platform.cluster.kernel || {};

platform.cluster.kernel.inject = async function (destinations,code,file,module,preprocess) {
  var preprocessed_code;
  if (preprocess === true) {
    preprocessed_code = await platform.kernel.preprocess(file,module,code);
  } else {
    preprocessed_code = native.eval(code);
  }
  return await platform.cluster.kernel.invoke(destinations,'platform.kernel.inject',[preprocessed_code,file,module,false]);
};

platform.cluster.kernel.load = async function(destinations,path,module) {
  return await platform.cluster.kernel.invoke(destinations,'platform.kernel.load',[path,module]);
};
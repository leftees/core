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

/**
 * Provides kernel functions to execute and manage environment.
 * @namespace
*/
platform.kernel = platform.kernel || {};

platform.kernel._preprocessors = platform.kernel._preprocessors || {};
platform.kernel._preprocessors.client = platform.kernel._preprocessors.client || [];
platform.kernel._preprocessors.client[0] = platform.kernel._preprocessors.client[0] || {};
platform.kernel._preprocessors.client[1] = platform.kernel._preprocessors.client[1] || {};
platform.kernel._preprocessors.client[2] = platform.kernel._preprocessors.client[2] || {};

platform.kernel._preprocessors.server = platform.kernel._preprocessors.server || [];
platform.kernel._preprocessors.server[0] = platform.kernel._preprocessors.server[0] || {};
platform.kernel._preprocessors.server[1] = platform.kernel._preprocessors.server[1] || {};
platform.kernel._preprocessors.server[2] = platform.kernel._preprocessors.server[2] || {};

/**
 * Augments Javascript code for injection to current environment.
 * @param {} code Specifies Javascript code to be augmented.
 * @param {} [path] Specifies the file name containing code to be augmented.
 * @param {} [module] Specifies name of the module that is augmenting code
 * @return {} Returns the augmented code.
*/
platform.kernel.preprocess = async function(path, module, code){
  var source_code = code;
  if (path != null && platform.io.cache.isCachedSync(path, 'built') === true) {
    return;
  }

  var shortpath = null;
  var resolved_path_object = null;
  if (source_code == null) {
    if (path != null) {
      resolved_path_object = platform.io.resolveSync(path);
      if (resolved_path_object == null) {
        throw new Exception('resource %s not found', path);
      }
      shortpath = resolved_path_object.shortpath;
      source_code = platform.io.get.stringSync(path);
    } else {
      throw new Exception('nothing to preprocess');
    }
  }

  var fullpath = (resolved_path_object != null) ? resolved_path_object.fullpath : null;

  if (fullpath != null && native.compile.scope != null){
    var meta_code = native.metascript.transform(source_code, fullpath, native.compile.scope,true);
    if (source_code !== meta_code){
      platform.io.backends.build.set.stringSync(path + '.meta', meta_code);
      source_code = meta_code;
    }
  }

  // logging
  if (platform.configuration.debug.kernel.preprocess === true) {
    if (path == null) {
      console.debug('preprocessing runtime code');
    } else {
      console.debug('preprocessing %s', shortpath);
      //console.debug('preprocessing %s', fullpath);
    }
  }

  var esnext_prefix = 'exports.__promise_ = (async function(){';
  var esnext_suffix = '\n})();';
  var ast = platform.parser.js.parse(esnext_prefix + source_code + esnext_suffix, fullpath);

  var side = null;
  if (path != null) {
    if (path.endsWith('.server.js') === true) {
      side = 'server';
    } else {
      side = 'client';
    }
  } else {
    side = 'server';
  }
  var preprocessors = platform.kernel._preprocessors[side];
  Object.keys(preprocessors).forEach(function (phase) {
    Object.keys(preprocessors[phase]).forEach(function (preprocessor) {
      var process = preprocessors[phase][preprocessor];
      if (typeof process === 'function') {
        if (platform.configuration.debug.kernel.preprocess === true) {
          if (path == null) {
            console.debug('preprocessing runtime code phase %s (%s)', phase, preprocessor);
          } else {
            console.debug('preprocessing %s phase %s (%s)', shortpath, phase, preprocessor);
            //console.debug('preprocessing %s phase %s (%s)', fullpath, phase, preprocessor);
          }
        }
        process(ast, source_code, path, module, preprocessor);
      }
    });
  });

  var generated = null;

  if (platform.configuration.debug.kernel.preprocess === true) {
    if (path == null) {
      console.debug('compiling runtime code');
    } else {
      console.debug('compiling %s', shortpath);
      //console.debug('compiling %s', fullpath);
    }
  }

  if (path != null) {
    generated = platform.parser.js.stringify(ast, true, false, fullpath);
    generated.map.sources = [ native.path.relative(native.path.join(platform.io.backends.build.base,path),fullpath).replace(/\\/g,'/').replace('../','') ];
    generated.map.sourcesContent = [source_code];
    // storing code to /runtime/ for debuggers (only for backend files...)
    var sourcemap_comment = '//# sourceMappingURL=' + native.path.basename(path) + '.map';
    // storing sourcemap to /runtime/ for debuggers (only for backend files...)
    platform.io.backends.build.set.stringSync(path, generated.code + '\n' + sourcemap_comment);
    platform.io.cache.set.stringSync(path, generated.code + '\n' + sourcemap_comment, 'built');
    platform.io.backends.build.set.stringSync(path + '.map', JSON.stringify(generated.map));
    if (platform.configuration.debug.kernel.preprocess === true) {
      console.debug('optimizing %s', shortpath);
      //console.debug('optimizing %s', fullpath);
    }
    var minified = native.parser.js.minifier.minify(generated.code, {
      //inSourceMap: generated.map,
      //outSourceMap: native.path.basename(path) + '.map',
      mangle: false,
      compress: true,
      comments: 'all',
      //sourceMapIncludeSources: true,
      fromString: true
    });
    platform.io.backends.build.set.stringSync(path + '.min', minified.code);
    platform.io.cache.set.stringSync(path + '.min', minified.code, 'built');
    //platform.io.backends.build.set.stringSync(path + '.map', minified.map);
  } else {
    //TODO: add support for inline source map for eval code
    generated = platform.parser.js.stringify(ast, false);
  }

  ast = null;

  //if (code != null) {
  return generated.code.toString();
  //}
};

/**
 * Injects Javascript code to current environment.
 * @param {} code Specifies Javascript code to be injected.
 * @param {} [file] Specifies the file name containing code to be injected.
 * @param {} [module] Specifies name of the module that is injecting code
 * @param {} [preprocess] Specifies whether the code should be augmented before injection. Default is false.
 * @return {} Returns the return value from injected code.
 * @alert  Temporary implementation uses the global.eval function, it will be replaced with global.require to support debuggers.
*/
platform.kernel.inject = async function (code,file,module,preprocess) {
  var preprocessed_code;
  if (preprocess === true) {
    preprocessed_code = await platform.kernel.preprocess(file,module,code);
  } else {
    preprocessed_code = native.eval(code);
  }
  return global.eval.call(global,preprocessed_code);
};

/**
 * Loads Javascript file into current environment.
 * @param {} path Specifies the file name containing code to be injected.
 * @param {} [module] Specifies name of the module that is injecting code
 * @return {} Returns the return value from loaded code.
 * @alert  This function will resolve paths, augment code if requested, cache and inject into current environment.
*/
platform.kernel.load = async function(path,module) {
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
  if(platform.configuration.debug.load === true){
    //console.info('loading %s',  resolved_path_object.shortpath);
    console.info('loading %s from %s (%s)', resolved_path_object.shortpath, resolved_path_object.backend.name, resolved_path_object.fullpath);
  }
//? if (CLUSTER) {
  platform.development.change.register(fullpath, platform.cluster.worker.id);
//? } else {
  platform.development.change.register(fullpath);
//? }
  // loading file through require
  var path_to_load = native.path.join(platform.io.backends.build.base,path);
  var exported = global.require(path_to_load + ((global.development === false) ? '.min' : ''));
  // invalidating main file from require cache
  delete global.require.cache[path_to_load];
  try {
    await exported.__promise_;
    delete exported.__promise_;
    return exported;
  } catch(err) {
    console.error(err);
    throw err;
  }
};

// registering 'build' store as new filesystem backend with server root path + /runtime/
//TODO: allow build store override by configuration
platform.io.store.register('build', platform.kernel.new('core.io.store.file', [ native.path.join(platform.configuration.runtime.path.root, 'build') ]), -1, true);

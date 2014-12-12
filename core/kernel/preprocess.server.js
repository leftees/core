/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

//N: Provides kernel functions to execute and manage environment.
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

//F: Augments Javascript code for injection to current environment.
//A: code: Specifies Javascript code to be augmented.
//A: [path]: Specifies the file name containing code to be augmented.
//A: [module]: Specifies name of the module that is augmenting code
//R: Returns the augmented code.
platform.kernel.preprocess = function(code, path, module){
  //C: logging
  if(platform.configuration.server.debugging.preprocess === true) {
    if (path == null) {
      console.debug('preprocessing runtime code');
    } else {
      console.debug('preprocessing %s', path);
    }
  }

  //C: compacting code and adding line marker as preprocessor
  var ast = platform.parser.js.parse(code);

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
  Object.keys(preprocessors).forEach(function(phase){
    Object.keys(preprocessors[phase]).forEach(function(preprocessor){
      var process = preprocessors[phase][preprocessor];
      if (typeof process === 'function'){
        if(platform.configuration.server.debugging.preprocess === true) {
          if (path == null) {
            console.debug('preprocessing runtime code phase %s (%s)', phase, preprocessor);
          } else {
            console.debug('preprocessing %s phase %s (%s)', path, phase, preprocessor);
          }
        }
        process(ast,code,path,module,preprocessor);
      }
    });
  });

  var generated_object = platform.parser.js.stringify(ast,true,true);
  ast = null;

  var generated_code = generated_object.code;
  var generated_map = generated_object.map.toJSON();

  if (path != null) {

    generated_map.sources = [ 'file://'+platform.io.resolve(path) ];
    generated_map.sourcesContent = [ code ];

    generated_code += '\n//# sourceMappingURL='+native.path.basename(path)+'.map';

    //C: storing code to /runtime/ for debuggers (only for backend files...)
    platform.kernel._backend.set.string(path, generated_code);
    //C: storing sourcemap to /runtime/ for debuggers (only for backend files...)
    platform.kernel._backend.set.string(path+'.map', JSON.stringify(generated_map));
  } else {
    //T: support source mapping for evals?
  }

  return generated_code;
};

//F: Injects Javascript code to current environment.
//A: code: Specifies Javascript code to be injected.
//A: [file]: Specifies the file name containing code to be injected.
//A: [module]: Specifies name of the module that is injecting code
//A: [preprocess]: Specifies whether the code should be augmented before injection. Default is true.
//R: Returns the return value from injected code.
//H: Temporary implementation uses the global.eval function, it will be replaced with global.require to support debuggers.
platform.kernel.inject = function (code,file,module,preprocess) {
  var preprocessed_code;
  if (preprocess === true && platform.kernel.preprocess != null && typeof platform.kernel.preprocess === 'function') {
    preprocessed_code = platform.kernel.preprocess(code,file,module);
  } else {
    preprocessed_code = code;
  }
  return global.eval.call(global,preprocessed_code);
};

//F: Loads Javascript file into current environment.
//A: path: Specifies the file name containing code to be injected.
//A: [module]: Specifies name of the module that is injecting code
//A: [preprocess]: Specifies whether the code should be augmented before injection. Default is true.
//R: Returns the return value from loaded code.
//H: This function will resolve paths, augment code if requested, cache and inject into current environment.
platform.kernel.load = function(path,module,preprocess) {
  //preprocess = false;
  //C: checking whether the file exists
  if (platform.io.exist(path) === false) {
    throw new Exception('resource %s not found', path);
  }
  //C: detecting if file is already cached
  var is_cached = platform.io.cache.is(path, 'built');
  var preprocessed_code;
  if (is_cached === false) {
    //C: getting file content
    var code = platform.io.get.string(path);
    //C: preprocessing code if required
    if ((preprocess == null || preprocess === true) && typeof platform.kernel.preprocess === 'function') {
      preprocessed_code = platform.kernel.preprocess(code,path,module);
    } else {
      preprocessed_code = code;
    }
    //C: caching augmented file
    //T: replace with sync set call
    platform.io.cache.set.string(path, 'built', preprocessed_code);
  } else {
    //C: getting file from cache
    preprocessed_code = platform.io.cache.get.string(path, 'built', true);
  }
  //C: loading file through require
  if (global.testing === true) {
    if(platform.configuration.server.debugging.load === true){
      console.debug('loading %s', path);
    }
    return global.require(native.path.join(platform.kernel._backend.base,path));
  } else {
    if(platform.configuration.server.debugging.load === true) {
      console.debug('loading %s' + ((is_cached === false) ? '' : ' from cache'), path);
    }
    return global.require.main._compile(preprocessed_code,native.path.join(platform.kernel._backend.base,path));
  }
};

//C: registering 'runtime' store as new filesystem backend with app root path + /runtime/
//T: allow build store override by configuration
platform.io.store.register('runtime', platform.kernel.new('core.io.store.file', [ native.path.join(platform.runtime.path.app, 'runtime') ]), -1);

//V: Stores the 'runtime' store backend.
platform.kernel._backend = platform.io.store.getByName('runtime');

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

//N: Provides kernel functions to execute and manage environment.
platform.kernel = platform.kernel || {};

//F: Augments Javascript code for injection to current environment.
//A: code: Specifies Javascript code to be augmented.
//A: [file]: Specifies the file name containing code to be augmented.
//A: [module]: Specifies name of the module that is augmenting code
//R: Returns the augmented code.
platform.kernel.preprocess = function(code, file, module){
  //C: logging
  if(platform.configuration.server.debugging.load === true) {
    if (file == null) {
      console.debug('preprocessing runtime code');
    } else {
      console.debug('preprocessing %s', file);
    }
  }

  var ast = native.esprima.parse(code,{ 'attachComment': true, 'range': true, 'comment': true });

  //T: migrate preprocessor stack from 0.3.x branch
  return code;
};

//F: Loads Javascript file into current environment.
//A: file: Specifies the file name containing code to be injected.
//A: [module]: Specifies name of the module that is injecting code
//A: [preprocess]: Specifies whether the code should be augmented before injection. Default is true.
//R: Returns the return value from loaded code.
//H: This function will resolve paths, augment code if requested, cache and inject into current environment.
platform.kernel.load = function(file,module,preprocess) {
  //C: checking whether the file exists
  if (platform.io.exist(file) === false) {
    throw new Exception('resource \'%s\' not found', file);
  }
  //C: detecting if file is already cached
  var is_cached = platform.io.cache.is(file, 'built');
  var preprocessed_code;
  if (is_cached === false) {
    //C: getting file content
    var code = platform.io.get.string(file);
    //C: preprocessing code if required
    if ((preprocess == null || preprocess === true) && typeof platform.kernel.preprocess === 'function') {
      preprocessed_code = platform.kernel.preprocess(code,file,module);
    } else {
      preprocessed_code = code;
    }
    //C: saving augmented file to be loaded through require (only for testing environment)
    if (global.testing === true) {
      platform.kernel.__backend__.set.string(file, preprocessed_code);
    }
    //C: caching augmented file
    //T: replace with sync  set call
    platform.io.cache.set.string(file, 'built', preprocessed_code);
  } else {
    //C: getting file from cache
    preprocessed_code = platform.io.cache.get.string(file, 'built', true);
  }
  //C: loading file through require
  if (global.testing === true) {
    if(platform.configuration.server.debugging.load === true){
      console.debug('loading %s', file);
    }
    return global.require(native.path.join(platform.kernel.__backend__.base,file));
  } else {
    if(platform.configuration.server.debugging.load === true) {
      console.debug('loading %s' + ((is_cached === false) ? '' : ' from cache'), file);
    }
    return global.require.main._compile('\n'+preprocessed_code,'app://'+file);
  }
};

//C: registering 'build' store as new filesystem backend with app root path + /build/
//T: allow build store override by configuration
platform.io.store.register('build',platform.kernel.new('core.io.store.file',[ native.path.join(platform.runtime.path.app,'build') ]),-1);

//V: Stores the 'build' store backend.
platform.kernel.__backend__ = platform.io.store.getByName('build');
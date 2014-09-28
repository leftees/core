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

//C: defining local bootstrap namespace
global.bootstrap = {};

//C: creating and enforcing global platform namespace
global.platform = {};
Object.defineProperty(global,"platform",{
  configurable: false,
  enumerable : true,
  writable: false,
  value: {}
});

global.platform.side = 'server';
Object.defineProperty(platform,"side",{
  configurable: false,
  enumerable : true,
  writable: false,
  value: 'server'
});

bootstrap._files = [];

//C: defining post power-on-self-test bootstrap function
bootstrap.post = function(){
  var time_start = Date.now();

  console.log('initializing core');
  //T: implement power-on-self-test

  //C: deleting temporary folder if any
  if (native.fs.existsSync(native.path.join(global.main.path.app, '/tmp')) === true) {
    native.fs.removeSync(native.path.join(global.main.path.app, '/tmp'));
  }

  //C: creating default folders
  //T: default folders should be created after platform.io stores loading for first store
  [ '/build', '/cache', '/core', '/data', '/lib', '/log', '/module', '/tmp' ].forEach(function(folder) {
    if (native.fs.existsSync(native.path.join(global.main.path.app, folder)) === false) {
      native.fs.ensureDirSync(native.path.join(global.main.path.app, folder));
    }
  });

  //C: loading core configuration from core root
  console.log('loading core configuration');
  bootstrap.loadFolder(global.main.path.core,'/core/config/');

  if(global.main.path.core !== global.main.path.app) {
    //C: loading core configuration overrides from app root
    bootstrap.loadFolder(global.main.path.app, '/core/config/');
  }

  //C: loading app configuration overrides from app root
  console.log('loading app configuration');
  bootstrap.loadFolder(global.main.path.app,'/config/');

  //C: loading preload module
  console.log('loading bootstrap modules');
  bootstrap.loadModules(platform.configuration.server.bootloader.preload,'/core/');

  //C: loading preprocessors for code augmentation
  console.log('loading core kernel preprocessors');
  bootstrap.loadModules(platform.configuration.server.kernel.preprocessors,'/core/kernel/preprocessors/server/');

  //C: switching to code-augmentation enabled bootstrap.load (assuming platform.environment is loaded)
  bootstrap.load = platform.environment.load;
  platform.environment._files = bootstrap._files;

  //C: loading preload module
  console.log('loading core modules');
  bootstrap.loadModules(platform.configuration.server.bootloader.modules,'/core/');

  var time_stop = Date.now();

  console.log('core initialized in %s', Number.toHumanTime(time_stop-time_start));

  platform.system.memory.collect();

  //T: switch to PXE (pre execution environment)
  //T: PXE test http ports to prevent EADDRINUSE exception later
  delete global.bootstrap;
};

//C: defining function to resolve relative paths against app or custom root
bootstrap.mapPath = function(path,root) {
  var normalized_path = path;
  //C: sanitizing empty path
  if (normalized_path === '') {
    normalized_path = '/';
  }
  //T: check if really neede on windows platforms
  //C: fixing separator (is it useful?)
  /*if (native.path.sep === '\\') {
    normalized_path = normalized_path.replace('/', '\\');
  }*/
  //C: normalizing through natives
  normalized_path = native.path.normalize(normalized_path);
  //C: returning path joined to custom or app root
  return  native.path.join(root||global.main.path.app, normalized_path);
};

//C: defining function to get data from uri with path resolution
bootstrap.get = function(path,load) {
  //T: define a resource class for delayed io/data loading
  var result = {};
  //T: implement support for remote resources (requires io/caching)
  //C: trying to resolve file against app, core and system root paths
  var uri;
  if (native.fs.existsSync(bootstrap.mapPath(path, global.main.path.app)) === true) {
    uri = bootstrap.mapPath(path, global.main.path.app);
  } else if (native.fs.existsSync(bootstrap.mapPath(path, global.main.path.core)) === true) {
    uri = bootstrap.mapPath(path, global.main.path.core);
  } else if (native.fs.existsSync(path) === true) {
    uri = path;
  }
  if (uri != null) {
    //C: creating result with .uri and delayed .data properties
    result.uri = uri;
    result.path = path;
    result._data = undefined;
    Object.defineProperty(result, 'data', { get: function () {
      //C: loading data if empty
      if (this._data === undefined) {
        try {
          //C: getting data from filesystem
          this._data = native.fs.readFileSync(this.uri, { encoding: 'utf-8' });
        } catch (e) {
          throw new Exception("file %s not found", this.uri, e);
        }
      }
      return this._data;
    }, set: function () {
    } });
    return result;
  } else {
    throw new Exception("file %s not found", path);
  }
};

//C: defining early bootstrap .js load function
bootstrap.load = function(path,root){
  var resource = bootstrap.get(native.path.join(root||'',path));
  try {
    /*if (global.testing === true) {
      global.require(resource.uri);
    } else {*/
      global.require.main._compile('\n'+resource.data,'app://'+path);
    //}
  } catch (ex) {
    throw new Exception("error loading %s: %s", resource.uri, ex.message, ex);
  }
  bootstrap._files.push(path);
};

bootstrap.loadFolder = function(root,path){
  if (native.fs.existsSync(bootstrap.mapPath(path,root)) === true) {
    var config_files = native.fs.readdirSync(bootstrap.mapPath(path,root));
    config_files.forEach(function (file) {
      if (file.endsWith('.server.js') === true) {
        bootstrap.load(native.path.join(path,file),root);
      }
    });
  }
};

bootstrap.loadModules = function(modules,path){
  modules.forEach(function(file){
    if (file.endsWith('.server.js') === true) {
      bootstrap.load(path + file);
    }
  });
};
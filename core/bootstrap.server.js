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

//C: defining local bootstrap namespace
global.bootstrap = {};

//C: creating and enforcing readonly global platform namespace
global.platform = {};
Object.defineProperty(global,"platform",{
  configurable: false,
  enumerable : true,
  writable: false,
  value: {}
});

//C: creating and enforcing readonly platform.side to enable node-type code awareness
global.platform.side = 'server';
Object.defineProperty(platform,"side",{
  configurable: false,
  enumerable : true,
  writable: false,
  value: 'server'
});

//C: defining an array to store the file names loaded during bootstrap
bootstrap._files = [];

//C: defining post power-on-self-test bootstrap function
bootstrap.post = function(){
  //C: starting stopwatch to profile bootstrap elapsed time
  var time_start = Date.now();

  //C: logging
  console.log('initializing core');

  //T: implement power-on-self-test

  //C: deleting temporary folder if any
  if (native.fs.existsSync(native.path.join(global.main.path.app, '/tmp')) === true) {
    native.fs.removeSync(native.path.join(global.main.path.app, '/tmp'));
  }

  //C: creating default folders
  //T: default folders should be created after platform.io stores loading for first store
  [ '/build', '/cache', '/core', '/data', '/lib', '/log', '/module', '/runtime', '/tmp' ].forEach(function(folder) {
    if (native.fs.existsSync(native.path.join(global.main.path.app, folder)) === false) {
      native.fs.ensureDirSync(native.path.join(global.main.path.app, folder));
    }
  });

  //C: loading core configuration from core root
  console.log('loading core configuration');
  bootstrap.loadFolder(global.main.path.core,'/core/config/');

  //C checking whether is necessary to override /core/config from app root
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
  bootstrap.loadModules(platform.configuration.server.kernel.preprocessors,'/core/kernel/preprocessors/');

  //C: switching to code-augmentation enabled bootstrap.load (assuming platform.environment is loaded)
  bootstrap.load = platform.environment.load;

  //C: copying bootstrap loaded files list to environment for further awareness of what is loaded
  platform.environment._files = bootstrap._files;

  //C: loading preload module
  console.log('loading core modules');
  bootstrap.loadModules(platform.configuration.server.bootloader.modules,'/core/');

  //C: getting stopwatch end to profile bootstrap elapsed time
  var time_stop = Date.now();

  //C: logging with bootstrap elapsed time
  console.log('core initialized in %s', Number.toHumanTime(time_stop-time_start));

  //C: forcing garbage collector to clean memory after preprocessing and multiple code loading
  platform.system.memory.collect();

  //T: switch to PXE (pre execution environment)
  //T: PXE test http ports to prevent EADDRINUSE exception later

  //C: destroying global bootstrap namespace
  delete global.bootstrap;
};

//C: defining function to resolve relative paths against app (default) or custom root
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
  //T: implement support for remote resources (requires io/caching)
  var result = {};
  //C: trying to resolve file against app, core and system root paths (in that order)
  var uri;
  if (native.fs.existsSync(bootstrap.mapPath(path, global.main.path.app)) === true) {
    uri = bootstrap.mapPath(path, global.main.path.app);
  } else if (native.fs.existsSync(bootstrap.mapPath(path, global.main.path.core)) === true) {
    uri = bootstrap.mapPath(path, global.main.path.core);
  } else if (native.fs.existsSync(path) === true) {
    uri = path;
  }
  //C: checking if something has been found
  if (uri != null) {
    //C: defining .path (input) and .uri (resolved path) properties in result object
    result.uri = uri;
    result.path = path;
    result._data = undefined;
    //C: defining .data property to get data when needed with dummy internal cache (sync implementation)
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

//C: defining load function to resolve and load a .server.js file (supporting also custom roots)
bootstrap.load = function(path,root){
  //C: trying to resolve request path
  var resource = bootstrap.get(native.path.join(root||'',path));
  try {
    //C: injecting code as hidden module
    global.require.main._compile('\n'+resource.data ,resource.uri);
  } catch (ex) {
    throw new Exception("error loading %s: %s", resource.uri, ex.message, ex);
  }
  //C: adding path to the loaded files list
  bootstrap._files.push(path);
};

//C: defining loadFolder function to load all .server.js file within a folder (no recursive)
bootstrap.loadFolder = function(root,path){
  //C: checking whether the folder exists
  if (native.fs.existsSync(bootstrap.mapPath(path,root)) === true) {
    //C: getting file lists (no recursive)
    var config_files = native.fs.readdirSync(bootstrap.mapPath(path,root));
    //C: loading every detected file if matches .server.js extension
    config_files.forEach(function (file) {
      if (file.endsWith('.server.js') === true) {
        bootstrap.load(native.path.join(path,file),root);
      }
    });
  }
};

//C: defining loadModules function to load .server.js files within an array of string (usually read from configuration)
bootstrap.loadModules = function(modules,path){
  //C: loading every listed file if matches .server.js extension
  modules.forEach(function(file){
    if (file.endsWith('.server.js') === true) {
      bootstrap.load(path + file);
    }
  });
};

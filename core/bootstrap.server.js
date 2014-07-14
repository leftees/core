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

//C: defining local bootstrap namespace
var bootstrap = {};

//C: defining reusable regular exceptions
bootstrap.regexs = {};
bootstrap.regexs.webURI = /^http[s]{0,1}:\/\//;
bootstrap.regexs.serverJS = /\.server\.js$/;

//C: creating and enforcing global platform namespace
Object.defineProperty(global,"platform",{
  configurable: false,
  enumerable : true,
  writable: false,
  value: {}
});

//C: defining post power-on-self-test bootstrap function
bootstrap.post = function(){
  console.log('initializing');
  //T: implement power-on-self-test

  //T: creating default folders

  var config_files;
  //C: loading core configuration from core root
  console.log('loading core configuration');
  if (native.fs.existsSync(bootstrap.mapPath('/core/config',global.main.path.core)) === true) {
    config_files = native.fs.readdirSync(bootstrap.mapPath('/core/config',global.main.path.core));
    config_files.forEach(function (file) {
      if (bootstrap.regexs.serverJS.test(file) === true) {
        bootstrap.load(global.main.path.core + '/core/config/' + file);
      }
    });
  }
  //C: loading core configuration overrides from app root
  if (native.fs.existsSync(bootstrap.mapPath('/core/config',global.main.path.app)) === true) {
    config_files = native.fs.readdirSync(bootstrap.mapPath('/core/config',global.main.path.app));
    config_files.forEach(function (file) {
      if (bootstrap.regexs.serverJS.test(file) === true) {
        bootstrap.load(global.main.path.app + '/core/config/' + file);
      }
    });
  }
  //C: loading app configuration overrides from app root
  console.log('loading app configuration');
  if (native.fs.existsSync(bootstrap.mapPath('/config',global.main.path.app)) === true) {
    config_files = native.fs.readdirSync(bootstrap.mapPath('/config',global.main.path.app));
    config_files.forEach(function (file) {
      if (bootstrap.regexs.serverJS.test(file) === true) {
        bootstrap.load(global.main.path.app + '/config/' + file);
      }
    });
  }

  //C: loading preload module
  console.log('loading bootstrap modules');
  platform.configuration.server.bootloader.preload.forEach(function(file){
    if (bootstrap.regexs.serverJS.test(file) === true) {
      bootstrap.load('/core/' + file);
    } else if(bootstrap.regexs.webURI.test(file) === true) {
      bootstrap.load(file);
    }
  });

  //C: loading preprocessors for code augmentation
  console.log('loading core kernel preprocessors');
  platform.configuration.server.kernel.preprocessors.forEach(function(file){
    if (bootstrap.regexs.serverJS.test(file) === true) {
      bootstrap.load('/core/kernel/preprocessors/server/' + file);
    } else if(bootstrap.regexs.webURI.test(file) === true) {
      bootstrap.load(file);
    }
  });

  //T: switching to code-augmentation enabled bootstrap.load
  //bootstrap.load = platform.kernel.load;

  //C: loading preload module
  console.log('loading bootstrap modules');
  platform.configuration.server.bootloader.modules.forEach(function(file){
    if (bootstrap.regexs.serverJS.test(file) === true) {
      bootstrap.load('/core/' + file);
    } else if(bootstrap.regexs.webURI.test(file) === true) {
      bootstrap.load(file);
    }
  });

  //T: switch to PXE (pre execution environment)
};

//C: defining function to resolve relative paths against app or custom root
bootstrap.mapPath = function(path,root) {
  var normalized_path = path;
  //C: adding leading slash
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
  //C: adding leading slash
  if (normalized_path.charAt(0) !== native.path.sep) {
    normalized_path = native.path.sep + normalized_path;
  }
  //C: returning path joined to custom or app root
  return  native.path.join(root||global.main.path.app, normalized_path);
};

//C: defining function to get data from uri with path resolution
bootstrap.get = function(uri,load) {
  //T: define a resource class for delayed io/data loading
  var result = {};
  //C: testing whether uri is an HTTP/HTTPS URL
  if (bootstrap.regexs.webURI.test(uri) === true) {
       //C: creating result with .uri and delayed .data properties
      result.uri = uri;
      result.__data = undefined;
      Object.defineProperty(result,'data',{ get: function(){
        //C: loading data if empty
        if (this.__data === undefined){
          try {
            //C: instancing and sending HTTP request
            var GetRequest = new XMLHttpRequest();
            GetRequest.open('GET',this.uri,false);
            GetRequest.send();
            this.__data = GetRequest.responseText;
          } catch(e) {
            throw new Exception("resource \'%s\' not found", uri, e);
          }
        }
        return this.__data;
      }, set: function(){} });
      return result;
  } else {
    //C: trying to resolve file against app, core and system root paths
    var file;
    if (native.fs.existsSync(bootstrap.mapPath(uri,global.main.path.app)) === true) {
      file = bootstrap.mapPath(uri,global.main.path.app);
    } else if (native.fs.existsSync(bootstrap.mapPath(uri,global.main.path.core)) === true) {
      file = bootstrap.mapPath(uri,global.main.path.core);
    } else if (native.fs.existsSync(uri) === true) {
      file = uri;
    }
    if (file !== undefined) {
      //C: creating result with .uri and delayed .data properties
      result.uri = file;
      result.__data = undefined;
      Object.defineProperty(result,'data',{ get: function(){
        //C: loading data if empty
        if (this.__data === undefined){
          try {
            //C: getting data from filesystem
            this.__data = native.fs.readFileSync(this.uri, { encoding: 'utf-8' });
          } catch(e) {
            throw new Exception("file \'%s\' not found", this.uri, e);
          }
        }
        return this.__data;
      }, set: function(){} });
      return result;
    } else {
      throw new Exception("file \'%s\' not found", uri);
    }
  }
};

//C: defining early bootstrap .js load function
bootstrap.load = function(uri){
  var resource = bootstrap.get(uri);
  console.debug('loading %s', resource.uri);
  try {
    global.require(resource.uri);
  } catch (ex) {
    throw new Exception("error loading \'%s\': %s", uri, ex.message, ex);
  }
};

//C: exporting bootstrap object
module.exports = exports = bootstrap;
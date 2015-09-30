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
 * Contains system namespace.
 * @namespace
*/
platform.system = platform.system || {};

platform.system.npm = platform.system.npm || {};

platform.system.npm._wrapper = platform.system.npm._wrapper || null;

platform.system.npm._init = function(callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  var npm = require('npm');
  npm.load({'dev': false, 'loglevel': 'silent'}, function () {
    platform.system.npm._wrapper = npm;
    callback.resolve();
  });

  return callback.promise;
};

platform.system.npm.list = function(callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.system.npm._wrapper.commands.list([], true, function (error, list) {
    if (error) {
      return callback.reject(error);
    }

    var result = [];
    Object.keys(list.dependencies).forEach(function(name){
      if (typeof list.dependencies[name] === 'object'){
        result.push(name);
      }
    });
    callback.resolve(result);
  });

  return callback.promise;
};

platform.system.npm.exists = function(name,version,callback){
  if (callback == null && typeof version === 'function'){
    callback = version;
    version = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.system.npm._wrapper.commands.list([], true, function (error, list) {
    if (error) {
      return callback.reject(error);
    }

    if (typeof list.dependencies[name] === 'object') {
      if (version != null) {
        //TODO: support semver matching
        callback.resolve(list.dependencies[name].version === version);
      } else {
        callback.resolve(true);
      }
    } else {
      callback.resolve(false);
    }
  });

  return callback.promise;
};

platform.system.npm.install = function(name,version,callback){
  if (callback == null && typeof version === 'function'){
    callback = version;
    version = null;
  }

  if (version != null) {
    name += '@' + version;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.system.npm._wrapper.commands.show([name], true, function (error, info) {
    if (error) {
      return callback.reject(error);
    }

    var versions = Object.keys(info);
    if(versions.length > 0) {
      console.info('npm installing %s', name);

      //if (process.platform === 'win32') {
        var npm_process = require('child_process').spawn(
          (process.platform === 'win32') ? 'cmd' : '/bin/bash',
          (process.platform === 'win32') ? ['/c', 'npm', 'install', name] : ['-c', '-l', `npm install ${name}`],
          {
            'stdio': 'inherit'
          });
        npm_process.on('exit', function (code, signal) {
          if (code === 0) {
            callback.resolve(name);
          } else {
            callback.reject(new Exception('install failed, see above and retry'));
          }
        });
      /*} else {
        platform.system.npm._wrapper.commands.install([name], function (error, info) {
          if (error) {
            return callback.reject(error);
          }
          if (info != null && info[0] != null && info[0][0] != null) {
            var installed_name = info[0][0];
            callback.resolve(installed_name.substr(installed_name.indexOf('@')+1));
          } else {
            callback.resolve();
          }
        });
      }*/
    } else {
      callback.reject(new Exception('npm package %s not found',name));
    }
  });

  return callback.promise;
};

platform.system.npm.uninstall = function(name,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  console.info('npm uninstalling %s', name);
  //if (process.platform === 'win32') {
    var npm_process = require('child_process').spawn(
      (process.platform === 'win32') ? 'cmd' : '/bin/bash',
      (process.platform === 'win32') ? ['/c', 'npm', 'uninstall', name] : ['-c', '-l', `npm uninstall ${name}`],
      {
        'stdio': 'inherit'
      });
    npm_process.on('exit', function (code, signal) {
      if (code === 0) {
        callback.resolve(name);
      } else {
        callback.reject(new Exception('uninstall failed, see above and retry'));
      }
    });
  /*} else {
    platform.system.npm._wrapper.commands.uninstall([name], function (error, info) {
      if (error) {
        return callback.reject(error);
      }
      callback.resolve();
    });
  }*/

  return callback.promise;
};

platform.system.npm.update = platform.system.npm.install;

platform.system.npm.upgradable = function(name,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.system.npm._wrapper.commands.show([name], true, function (error, info) {
    if (error) {
      return callback.reject(error);
    }

    var versions = Object.keys(info);
    if(versions.length > 0) {
      //TODO: compare against real version (semver?) just in case of backported upgrades
      platform.system.npm.exists(name,versions[0]).then(function(exists){
        callback.resolve(!exists);
      });
    } else {
      callback.reject(new Exception('npm package %s not found',name));
    }
  });

  return callback.promise;
};

platform.system.npm.info = function(name,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.system.npm._wrapper.commands.list([], true, function (error, list) {
    if (error) {
      return callback.reject(error);
    }

    if (typeof list.dependencies[name] === 'object') {
      callback.resolve(list.dependencies[name]);
    } else {
      callback.reject(new Exception('npm package %s not found',name));
    }
  });

  return callback.promise;
};

platform.events.attach('core.init', 'npm.init', async function(){
  await platform.system.npm._init();
});

global.load = async function(name){
  var lockid = await runtime.waitAndLock('maintenance');
  var unlock = function(){
    runtime.unlock('maintenance',lockid);
  };
  var result;
  try {
    result = require(name);
  } catch(e) {
    await platform.system.npm.install(name);
    try {
      result = require(name);
    } catch(e) {}
  }
  runtime.unlock('maintenance',lockid);
  return result;
};
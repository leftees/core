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

// creating global platform-wide exception object for managed error handling/remoting
global.Exception = function(messageOrObject){
  var formatted_message = null;
  var arguments_array = Array.prototype.slice.call(arguments);
  var name = 'Exception';
  var internal_error = null;
  this.date = new Date();
  if (messageOrObject != null && native.util.isError(messageOrObject) === true){
    arguments_array.shift();
    // getting formatted message from arguments (emulating behavior of console.log)
    if (arguments_array.length > 0) {
      formatted_message = native.util.format.apply(native.util, arguments_array);
      // removing original message from arguments
      arguments_array.shift();
    }
    this.date = messageOrObject.date || this.date;
    this.name = messageOrObject.name;
    if (formatted_message != null){
      this.message = formatted_message + ': ' + messageOrObject.message;
    } else {
      this.message = messageOrObject.message;
    }
    this.data = [].concat(messageOrObject.data);
    // storing arguments as exception data
    if (arguments_array.length > 0) {
      this.data = this.data.concat(arguments_array);
    }
    this.dump = messageOrObject.dump;
    this.block = messageOrObject.block;
    this.stack = messageOrObject.stack;
    //delete messageOrObject.date;
    //delete messageOrObject.name;
    //delete messageOrObject.message;
    //delete messageOrObject.dump;
    //delete messageOrObject.data;
    //delete messageOrObject.block;
    //delete messageOrObject.stack;
    for (var key in messageOrObject) {
      this[key] = messageOrObject[key];
    }
  } else if (messageOrObject != null && Array.isArray(messageOrObject) === true &&
    messageOrObject.hasOwnProperty('destinations') === true &&
    messageOrObject.hasOwnProperty('failed') === true &&
    messageOrObject.hasOwnProperty('succeed') === true) {
    //if (messageOrObject.destinations.length === 1) {
    //this.message = 'at node ' + messageOrObject.destinations[0] + ': ' + messageOrObject[0].message;
    //} else {
    this.message = messageOrObject.failed.length + ' failed, ' + messageOrObject.succeed.length + ' succeed';
    //}
    this.name = 'RemoteError';
    this.destinations = messageOrObject.destinations;
    this.failed = {};
    this.succeed = {};
    this.stack = '';
    internal_error = new Error(formatted_message);
    var internal_stack = internal_error.stack.replace(/\n\s*?at Error\.global\.Exception.*?\n/, '\n').replace(/^.*?\n/,'');
    messageOrObject.destinations.forEach((function(worker,index){
      var result = messageOrObject[index];
      if (messageOrObject.failed.indexOf(worker) === -1) {
        this.succeed[worker] = result;
      } else {
        this.failed[worker] = result;
        this.stack += result.name + ' at node ' + worker + ': ' + result.stack + '\n';
        this.stack += '... stack continue at node ' + platform.cluster.worker.id + '...\n';
        this.stack += internal_stack;
      }
    }).bind(this));
  } else if (typeof messageOrObject === 'string') {
    // getting message argument
    formatted_message = messageOrObject;
    // sanitizing message to 'unknown' if missing
    if (formatted_message == null) {
      formatted_message = 'unknown';
    }
    // getting formatted message from arguments (emulating behavior of console.log)
    if (arguments_array.length > 0) {
      formatted_message = native.util.format.apply(native.util, arguments_array);
      // removing original message from arguments
      arguments_array.shift();
    }
    internal_error = new Error(formatted_message);
    this.name = internal_error.name = name;
    this.message = formatted_message;
    // storing arguments as exception data
    if (arguments_array.length > 0) {
      this.data = arguments_array;
    }
    // initializing dump as null (will be populated by embedded runtime debugger)
    this.dump = null;
    this.block = null;
    // patching stack
    this.stack = internal_error.stack.replace(/\n\s*?at Error\.global\.Exception.*?\n/, '\n');
  }
  if (this.worker == null && global.platform != null && global.platform.cluster != null){
    this.worker = platform.cluster.worker.id;
  }
};
global.Exception.prototype = Error.prototype;
global.Error.prototype.toJSON = function(){
  return {
    'message': this.message,
    'name': this.name,
    'block': this.block,
    'function': this.function,
    'inner': this.inner,
    'data': this.data,
    'dump': this.dump,
    'date': this.date,
    'stack': this.stack,
    'worker': this.worker
  };
};

if (native.cluster.isMaster === true) {
  native.cluster.setupMaster({
    silent: false
  });
}

/**
 * Contains all platform namespaces.
 * @namespace
*/
global.platform = {};

// enforcing readonly global platform namespace
Object.defineProperty(global,'platform',{
  configurable: false,
  enumerable : true,
  writable: false,
  value: global.platform
});

/**
 * Contains all application module namespaces.
 * @namespace
*/
global.app = {};

// enforcing readonly global platform namespace
Object.defineProperty(global,'app',{
  configurable: false,
  enumerable : true,
  writable: false,
  value: global.app
});

if(platform.id == null) {
  //TODO: store to disk for hot-reboot and session invalidation
  platform.id = native.uuid.v4();

  Object.defineProperty(platform, 'id', {
    configurable: false,
    enumerable: true,
    writable: false
  });
}

// pre-defining application server configuration namespace
platform.configuration = {};

/**
 * Provides platform runtime namepace for automatic/volatile data.
 * @namespace
*/
platform.configuration.runtime = platform.configuration.runtime || {};

// moving global environment to runtime.env namespace
platform.configuration.runtime.debugging = global.debugging;
platform.configuration.runtime.development = global.development;
platform.configuration.runtime.testing = global.testing;

// moving global environment to runtime.env namespace
platform.configuration.runtime.path = global.main.path;

// pre-defining cluster namespace
platform.cluster = platform.cluster || {};

// pre-defining current worker data needed for bootstrap
platform.cluster.worker = platform.cluster.worker || {};
platform.cluster.worker.pid = process.pid;
platform.cluster.worker.id = process.env['CLUSTER_NODE_ID'] || ((native.cluster.worker) ? ('?' + native.cluster.worker.id.toString() + '?') : 'master');
platform.cluster.worker.role = process.env['CLUSTER_NODE_ROLE'] || 'master';
platform.cluster.worker.master = native.cluster.isMaster;

console.logger = new native.winston.Logger({
  levels: {
    trace: 0,
    verbose: 2,
    debug: 4,
    info: 5,
    data: 6,
    warn: 7,
    error: 8
  },
  colors: {
    trace: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    info: 'green',
    data: 'grey',
    warn: 'yellow',
    error: 'red'
  }
});
native.winston.config.addColors({
  trace: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  info: 'green',
  data: 'grey',
  warn: 'yellow',
  error: 'red'
});
console.logger.formatters = console.logger.formatters || {};
console.logger.formatters.console = function(options) {
  return (new Date()).toISOString() + ' ' + options.label + ' ' +
    native.winston.config.colorize(options.level,options.level.toLowerCase()) + ': ' +
    native.winston.config.colorize(options.level,((options.message != null) ? options.message : '')) +
    ((options.meta != null && Object.keys(options.meta).length > 0) ? '\n' + native.util.inspect(options.meta,{ 'colors': true, 'depth': null}) : '' );
};
console.logger.formatters.file = function(options) {
  var cache = [];
  return JSON.stringify({
    'label': options.label,
    'timestamp': (new Date()).toISOString(),
    'level': options.level,
    'message': options.message,
    'meta': ((options.meta != null && Object.keys(options.meta).length > 0) ? options.meta : undefined)
  });
};
console.logger.add(native.winston.transports.Console,{
  'label': '@' + process.pid + ' ' + platform.cluster.worker.id,
  'level': ((global.debugging === true) ? 'trace' : ((global.development) ? 'debug' : 'info')),
  'debugStdout': true,
  'formatter': console.logger.formatters.console
});
console.logger.add(native.winston.transports.File,{
  'label': platform.cluster.worker.id,
  'name': 'file.info.node',
  'filename': native.path.join(platform.configuration.runtime.path.root,'/log/' + platform.cluster.worker.id + '/info.log'),
  'level': 'info',
  'json': false,
  'formatter': console.logger.formatters.file
});
console.logger.add(native.winston.transports.File,{
  'label': platform.cluster.worker.id,
  'name': 'file.error.node',
  'filename': native.path.join(platform.configuration.runtime.path.root,'/log/' + platform.cluster.worker.id + '/error.log'),
  'level': 'error',
  'json': false,
  'formatter': console.logger.formatters.file
});
console.logger.add(native.winston.transports.File,{
  'label': platform.cluster.worker.id,
  'name': 'file.debug.node',
  'filename': native.path.join(platform.configuration.runtime.path.root,'/log/' + platform.cluster.worker.id + '/debug.log'),
  'level': 'trace',
  'json': false,
  'formatter': console.logger.formatters.file
});
console.logger.add(native.winston.transports.File,{
  'label': platform.cluster.worker.id,
  'name': 'file.info.all',
  'filename': native.path.join(platform.configuration.runtime.path.root,'/log/info.log'),
  'level': 'info',
  'json': false,
  'formatter': console.logger.formatters.file
});
console.logger.add(native.winston.transports.File,{
  'label': platform.cluster.worker.id,
  'name': 'file.error.all',
  'filename': native.path.join(platform.configuration.runtime.path.root,'/log/error.log'),
  'level': 'error',
  'json': false,
  'formatter': console.logger.formatters.file
});
console.logger.add(native.winston.transports.File,{
  'label': platform.cluster.worker.id,
  'name': 'file.debug.all',
  'filename': native.path.join(platform.configuration.runtime.path.root,'/log/debug.log'),
  'level': 'trace'
});

if (global.testing === false) {
  console.log = console.logger.info;
  [/*'trace',*/'debug','verbose','info','data','warn','error'].forEach(function (level) {
    console[level] = console.logger[level];
  });
}

['/log/'+platform.cluster.worker.id].forEach(function (folder) {
  if (native.fs.existsSync(native.path.join(platform.configuration.runtime.path.root, folder)) === false) {
    native.fs.ensureDirSync(native.path.join(platform.configuration.runtime.path.root, folder));
  }
});

// defining local bootstrap namespace
global.bootstrap = {};

platform._states = {
  'POST': 0,
  'PRELOAD': 1,
  'CORE_INIT': 2,
  'CORE_WAIT': 3,
  'CORE_READY': 4,
  'APP_INIT': 5,
  'APP_READY': 6
};

platform.state = platform._states.POST;

/**
 * Contains an array to store the file names loaded inside the environment
 * @type {Object}
*/
bootstrap.files = [];

if (process.env.BUILD === 'pack') {
  native.fs.ensureDirSync(native.path.join(platform.configuration.runtime.path.core,'/build/pack/'));
  bootstrap.dist = {};
  bootstrap.dist.boot = new native.parser.js.sourcemap.concat(true, platform.cluster.worker.role + '.server.js.boot', '})();(function(){', '(function(){','})();');
  bootstrap.dist.core = new native.parser.js.sourcemap.concat(true, platform.cluster.worker.role + '.server.js', '})();(function(){', '(function(){','})();');
}

// defining post power-on-self-test bootstrap function
bootstrap.post = async function() {
  // starting stopwatch to profile bootstrap elapsed time
  var time_start = Date.now();
  console.log('node initialized in %s', Number.toHumanTime(time_start - process.startTime));

  // destroying global main namespace
  delete global.main;

  // logging
  console.log('initializing core');

  if (native.cluster.isMaster === true) {
    // deleting temporary folder if any
    if (native.fs.existsSync(native.path.join(platform.configuration.runtime.path.root, '/tmp')) === true) {
      native.fs.removeSync(native.path.join(platform.configuration.runtime.path.root, '/tmp'));
    }

    // creating default folders
    //TODO: default folders should be created after platform.io stores loading for first store
    ['/app', '/cache', '/core', '/data', '/lib', '/log', '/build', '/tmp'].forEach(function (folder) {
      if (native.fs.existsSync(native.path.join(platform.configuration.runtime.path.root, folder)) === false) {
        native.fs.ensureDirSync(native.path.join(platform.configuration.runtime.path.root, folder));
      }
    });
  }

  //TODO: implement power-on-self-test

  // loading bootstrap configuration
  console.log('loading bootstrap configuration');
  await bootstrap.load.file('/core/config/bootstrap/cluster.server.js',platform.configuration.runtime.path.core);

  // loading generic node configuration
  console.log('loading core configuration');
  await bootstrap.load.array(platform.configuration.bootstrap.config.generic, native.path.join(platform.configuration.runtime.path.core,'/core/config/'));

  // loading generic node configuration
  console.log('loading app configuration');
  await bootstrap.load.folder('/config/',platform.configuration.runtime.path.root);

  // deleting global env state variable
  delete global.debugging;
  delete global.development;
  delete global.testing;

  platform.state = platform._states.PRELOAD;

  // preloading bootstrap modules or boot pack
  //TODO: support remote build store
  var boot_dist_path = native.path.join(platform.configuration.runtime.path.core,'dist/cluster/boot/' + platform.cluster.worker.role + '.server.js.boot');
  if (process.env.BUILD == null && native.fs.existsSync(boot_dist_path + ((platform.configuration.runtime.development === false) ? '.min' : '')) === true){
    console.log('preloading built-in boot modules');
    require(boot_dist_path + ((platform.configuration.runtime.development === false) ? '.min' : ''));
  } else {
    var boot_pack_path = native.path.join(platform.configuration.runtime.path.core,'build/pack/' + platform.cluster.worker.role + '.server.js.boot');
    // preloading generic bootstrap modules
    console.log('preloading generic boot modules');
    await bootstrap.load.array(platform.configuration.bootstrap.init.generic, native.path.join(platform.configuration.runtime.path.core,'/core/'));

    // loading role-specific bootstrap modules
    console.log('preloading %s boot modules', platform.cluster.worker.role);
    await bootstrap.load.array(platform.configuration.bootstrap.init[platform.cluster.worker.role], native.path.join(platform.configuration.runtime.path.core,'/core/'));

    // creating pack
    if (process.env.BUILD === 'pack') {
      native.fs.writeFileSync(boot_pack_path, bootstrap.dist.boot.content.toString() + '\n//# sourceMappingURL=' + platform.cluster.worker.role + '.server.js.boot.map');
      native.fs.writeFileSync(boot_pack_path+'.map',bootstrap.dist.boot.sourceMap);
    }
  }

  await platform.events.raise('core.init');
  platform.events.unregister('core.init');

  // logging with bootstrap elapsed time
  console.log('core initialized in %s', Number.toHumanTime(Date.now() - time_start));

  platform.state = platform._states.CORE_INIT;

  bootstrap.load.file = async function (path, root) {
    var fullpath = native.path.join(root||'',path);
    var relativepath = fullpath;
    if (fullpath.indexOf(platform.configuration.runtime.path.core) === 0) {
      relativepath = fullpath.replace(platform.configuration.runtime.path.core,'');
    } else if (fullpath.indexOf(platform.configuration.runtime.path.root) === 0) {
      relativepath = fullpath.replace(platform.configuration.runtime.path.root,'');
    }
    var result = await platform.kernel.load(relativepath, 'core');
    //TODO: support remote build store
    if (process.env.BUILD === 'pack' && platform.state === platform._states.CORE_INIT) {
      var dist_source_map = JSON.parse(native.fs.readFileSync(native.path.join(native.compile.basepath, relativepath) + '.map', { 'encoding': 'utf8' }));
      dist_source_map.sources = dist_source_map.sources.map(function(source_path){
        return source_path.replace(/^(\.\.\/)*/g,'../../../');
      });
      bootstrap.dist.core.add(
        '../../../' + path.replace(/\\/g,'/'),
        native.fs.readFileSync(native.path.join(native.compile.basepath, relativepath), { 'encoding': 'utf8' }).replace(/\n\s*\/\/\# sourceMappingURL=.*?\n|\n\s*\/\/\# sourceMappingURL=.*?$/gi,''),
        JSON.stringify(dist_source_map)
      );
    }
    return result;
  };

  // loading modules or core pack
  //TODO: support remote build store
  var core_dist_path = native.path.join(platform.configuration.runtime.path.core,'dist/cluster/boot/' + platform.cluster.worker.role + '.server.js');
  if (process.env.BUILD == null && native.fs.existsSync(core_dist_path + ((platform.configuration.runtime.development === false) ? '.min' : '')) === true){
    console.log('loading built-in %s core modules', platform.cluster.worker.role);
    require(core_dist_path + ((platform.configuration.runtime.development === false) ? '.min' : ''));
  } else {
    var core_pack_path = native.path.join(platform.configuration.runtime.path.core,'build/pack/' + platform.cluster.worker.role + '.server.js');
    // loading generic bootstrap modules
    console.log('loading generic boot modules');
    await bootstrap.load.array(platform.configuration.bootstrap.init.generic, native.path.join(platform.configuration.runtime.path.core,'/core/'));

    // loading role-specific bootstrap modules
    console.log('loading %s boot modules', platform.cluster.worker.role);
    await bootstrap.load.array(platform.configuration.bootstrap.init[platform.cluster.worker.role], native.path.join(platform.configuration.runtime.path.core,'/core/'));

    // loading generic modules
    console.log('loading generic core modules');
    await bootstrap.load.array(platform.configuration.bootstrap.core.generic, native.path.join(platform.configuration.runtime.path.core,'/core/'));

    // loading role-specific modules
    console.log('loading %s core modules', platform.cluster.worker.role);
    await bootstrap.load.array(platform.configuration.bootstrap.core[platform.cluster.worker.role], native.path.join(platform.configuration.runtime.path.core,'/core/'));

    // creating pack
    if (process.env.BUILD != null) {
      native.fs.writeFileSync(core_pack_path, bootstrap.dist.core.content.toString() + '\n//# sourceMappingURL=' + platform.cluster.worker.role + '.server.js.map');
      native.fs.writeFileSync(core_pack_path+'.map',bootstrap.dist.core.sourceMap);
    }
  }

  platform.events.attachAfter('core.ready','bootstrap.files',null, async function(){
    await platform.cluster.kernel.invoke('compile','platform.development.change.register',[bootstrap.files, platform.cluster.worker.id]);
  });

  platform.state = platform._states.CORE_WAIT;

  if (platform.cluster.worker.master === true) {
    await sleepUntil(async function(){
      var states = await platform.cluster.kernel.get('!','platform.state');
      return states.every(function(state){
        return state === platform._states.CORE_WAIT;
      });
    },500);
  }

  if (platform.cluster.worker.master === true) {
    await platform.events.remote.raise('!', 'core.ready');
    await platform.events.raise('core.ready');
  } else {
    await platform.events.wait('core.ready');
  }
  platform.events.unregister('core.ready');

  platform.state = platform._states.CORE_READY;

  // logging with bootstrap elapsed time
  console.log('core ready in %s', Number.toHumanTime(Date.now() - time_start));

  // destroying global bootstrap namespace
  delete global.bootstrap;

  platform.state = platform._states.APP_INIT;

  platform.state = platform._states.APP_READY;

  if (platform.cluster.worker.master === true) {
    await platform.events.remote.raise('!', 'application.ready');
    await platform.events.raise('application.ready');
  } else {
    await platform.events.wait('application.ready');
  }
  platform.events.unregister('application.ready');

  // forcing garbage collector to clean memory
  if (platform.cluster.worker.master === true) {
    platform.cluster.system.memory.collect();
  }

  // logging with bootstrap elapsed time
  console.log('application ready in %s', Number.toHumanTime(Date.now() - time_start));

  if (platform.cluster.worker.master === true && process.env.BUILD != null) {
    process.exit();
  }
};

// defining function to resolve relative paths against server (default) or custom root
bootstrap.map = function(path,root) {
  // sanitizing empty path
  if (path == null || path === '') {
    path = '/';
  }
  // returning path joined to custom or server root
  return native.path.nornalize(native.path.join(root||platform.configuration.runtime.path.root, path));
};

// contains the load methods needed during bootstrap
bootstrap.load = {};

// defining load function to resolve and load a file (supporting also custom roots and overlay fs)
bootstrap.load.file = function(path,root,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  // joining root
  var fullpath = native.path.join(root||'',path);
  var relativepath = fullpath;
  var shortpath = /*'system:/' +*/ fullpath.replace(/\\/g,'/');
  var basename = 'system';
  var rootpath = '/';
  // checking whether path exists
  if (native.fs.existsSync(fullpath) === true) {
    try {
      if (fullpath.indexOf(platform.configuration.runtime.path.root) === 0) {
        relativepath = fullpath.replace(platform.configuration.runtime.path.root,'');
        shortpath = /*'root:/' +*/ relativepath.replace(/\\/g,'/');
        basename = 'root';
        rootpath = platform.configuration.runtime.path.root;
      } else if (fullpath.indexOf(platform.configuration.runtime.path.core) === 0) {
        relativepath = fullpath.replace(platform.configuration.runtime.path.core,'');
        shortpath = /*'core:/' +*/ relativepath.replace(/\\/g,'/');
        basename = 'core';
        rootpath = platform.configuration.runtime.path.core;
      }
      if (platform.configuration.runtime.debugging === true) {
        //console.info('boot loading %s',shortpath);
        console.info('boot loading %s from %s (%s)',shortpath,basename,fullpath);
      }
      // injecting compiled code
      //if (platform.state === platform._states.POST) {
      //native.compile(path, root, null, false, false);
      //} else {
      native.compile(relativepath, rootpath, basename + '.boot', true, !platform.configuration.runtime.development);
      //}
      //TODO: support remote build store
      if (process.env.BUILD != null && platform.state === platform._states.PRELOAD) {
        var dist_source_map = JSON.parse(native.fs.readFileSync(native.path.join(native.compile.basepath, relativepath) + '.' + basename + '.boot.map', { 'encoding': 'utf8' }));
        dist_source_map.sources = dist_source_map.sources.map(function(source_path){
          return source_path.replace(/^(\.\.\/)*/g,'../../../') + '.boot';
        });
        bootstrap.dist.boot.add(
          '../../../' + path.replace(/\\/g,'/') + '.boot',
          native.fs.readFileSync(native.path.join(native.compile.basepath, relativepath) + '.' + basename + '.boot', { 'encoding': 'utf8' }).replace(/\n\s*\/\/\# sourceMappingURL=.*?\n|\n\s*\/\/\# sourceMappingURL=.*?$/gi,''),
          JSON.stringify(dist_source_map)
        );
      }
      // adding path to the loaded files list
      if (bootstrap.files.indexOf(path) === -1) {
        bootstrap.files.push(path);
      }
    } catch (ex) {
      //callback.reject(new Exception('error loading %s: %s', shortpath, ex.message, ex));
      callback.reject(new Exception('error loading %s from %s: %s', shortpath, fullpath, ex.message, ex));
    }
    callback.resolve(true);
  } else {
    callback.reject(new Exception('file %s not found', path));
  }
  return callback.promise;
};

// defining loadFolder function to load all .server.js file within a folder (no recursive)
bootstrap.load.folder = function(path,root,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  // joining root
  var fullpath = native.path.join(root||'',path);
  // checking whether the folder exists
  if (native.fs.existsSync(fullpath) === true) {
    // getting file lists (no recursive)
    var found_files = native.fs.readdirSync(fullpath);
    // loading every detected file if matches .server.js extension
    var error = false;
    var tasks = [];
    found_files.forEach(function(file) {
      if (file.endsWith('.server.js') === true) {
        tasks.push(function (task_callback) {
          if (error === false) {
            bootstrap.load.file(native.path.join(path,file),root).then(function (task_result) {
              task_callback();
            }, function (task_error) {
              error = true;
              task_callback();
              callback.reject(task_error);
            });
          }
        });
      }
    });
    native.async.series(tasks,function(){
      if (error === false) {
        callback.resolve(undefined);
      }
    });
  } else {
    callback.resolve(undefined);
  }

  return callback.promise;
};

// defining loadModules function to load .server.js files within an array of string (usually read from configuration)
bootstrap.load.array = function(paths,root,callback){
  callback = native.util.makeHybridCallbackPromise(callback);
  // loading every listed file if matches .server.js extension
  var error = false;
  var tasks = [];
  paths.forEach(function(path) {
    if (path.endsWith('.server.js') === true) {
      tasks.push(function (task_callback) {
        if (error === false) {
          bootstrap.load.file(path, root).then(function (task_result) {
            task_callback();
          }, function (task_error) {
            error = true;
            task_callback();
            callback.reject(task_error);
          });
        }
      });
    }
  });
  native.async.series(tasks,function(){
    if (error === false) {
      callback.resolve(undefined);
    }
  });

  return callback.promise;
};

// returning bootstrap
native.extend(exports,bootstrap);
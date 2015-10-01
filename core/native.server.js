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
 * Contains all native namespaces.
 * @namespace native
*/
global.native = {};

// enforcing readonly global native namespace
Object.defineProperty(global,'native',{
  configurable: false,
  enumerable : true,
  writable: false,
  value: global.native
});

var defineNative = function(root,property,module,member,callback){
  if (callback == null && typeof member === 'function'){
    callback = member;
    member = null;
  }
  Object.defineProperty(root,property,{
    'get': function(){
      var result = require(module);
      if (typeof member === 'string'){
        result = result[member];
      }
      delete root[property];
      root[property] = result;
      if (typeof callback === 'function') {
        callback();
      }
      return root[property];
    },
    'enumerable': true,
    'configurable': true
  });
};

// loading native modules and node-specific ones
//native.extend = require('util')._extend;
defineNative(native,'extend','util','_extend');
//native.semver = require('semver');
defineNative(native,'semver','semver');
//native.os = require('os');
defineNative(native,'os','os');
//native.domain = require('domain');
defineNative(native,'domain','domain');
//native.fs = require('fs-extra');
defineNative(native,'fs','fs-extra',function(){
  //native.fs.readdirp = require('readdirp');
  defineNative(native.fs,'readdirp','readdirp');
});
//native.child = require('child_process');
defineNative(native,'child','child_process');
//native.stream = require('stream');
defineNative(native,'stream','stream');
//native.net = require('net');
defineNative(native,'net','net');
//native.path = require('path');
defineNative(native,'path','path');
//native.util = require('util');
defineNative(native,'util','util');
//native.url = require('url');
defineNative(native,'url','url');
//native.events = require('events');
defineNative(native,'events','events');
//native.querystring = require('querystring');
defineNative(native,'querystring','querystring');
//native.useragent = require('useragent');
defineNative(native,'useragent','useragent',function(){
  //TODO: fix update path for global installations
  //native.useragent(true);
  require('useragent/features');
});
//native.http = require('http');
defineNative(native,'http','http');
//native.https = require('https');
defineNative(native,'https','https');
native.httpauth ={};
//native.httpauth.basic = require('http-auth').basic;
defineNative(native.httpauth,'basic','http-auth','basic');
//native.httpauth.digest = require('http-auth').digest;
defineNative(native.httpauth,'digest','http-auth','digest');
//native.crypto = require('crypto');
defineNative(native,'crypto','crypto');
native.websocket = {};
//native.websocket.server = require('ws').Server;
defineNative(native.websocket,'server','ws','Server');
//native.args = require('yargs').argv;
defineNative(native,'args','yargs','argv');

// properly load zlib native module with sync implementations (on node version 0.10.0 - 0.11.11 we'll use our node-zlib-backport)
if (native.semver.satisfies(native.semver.clean(process.version),'0.10.0 - 0.11.11') === true) {
  //native.zlib = require('node-zlib-backport');
  defineNative(native,'zlib','node-zlib-backport');
} else {
  //native.zlib = require('zlib');
  defineNative(native,'zlib','zlib');
}

native.body = {};
//native.body.text = require('body');
defineNative(native.body,'text','body');
//native.body.json = require('body/json');
defineNative(native.body,'json','body/json');
//native.body.form = require('body/form');
defineNative(native.body,'form','body/form');
//native.body.multipart = require('multiparty').Form;
defineNative(native.body,'multipart','multiparty','Form');
//native.cookie = require('cookie');
/*native.cookie.create = native.cookie.serialize;
native.cookie.serialize = function(data){
  var result = [];
  Object.keys(data).forEach(function(name){
    result.push(name+'='+data[name]);
  });
  return result.join('; ');
};*/
//native.cookie._signature = require('cookie-signature');
//native.cookie.sign = native.cookie._signature.sign;
//native.cookie.unsign = native.cookie._signature.unsign;
defineNative(native,'cookie','cookie',function(){
  native.cookie.create = native.cookie.serialize;
  native.cookie.serialize = function(data){
    var result = [];
    Object.keys(data).forEach(function(name){
      result.push(name+'='+data[name]);
    });
    return result.join('; ');
  };
  defineNative(native.cookie,'_signature','cookie-signature',function(){
    native.cookie.sign = native.cookie._signature.sign;
    native.cookie.unsign = native.cookie._signature.unsign;
  });
});
native.dom = {};
//native.dom.html = require('jsdom');
defineNative(native.dom,'html','jsdom',function(){
  native.dom.html.defaultDocumentFeatures = {
    FetchExternalResources: false,
    ProcessExternalResources: false
  };
});
//native.dom.xml = require('libxmljs').parseXml;
defineNative(native.dom,'xml','libxmljs','parseXml');
//native.request = require('request');
defineNative(native,'request','request');
//native.moment = require('moment');
defineNative(native,'moment','moment');
native.parser = {};
native.parser.js = {};
//native.parser.js.parse = require('acorn-babel-codetag').parse;
defineNative(native.parser.js,'parse','acorn-babel-codetag','parse',function(){
  native.parser.js._parse = native.parser.js.parse;
  native.parser.js.parse = function (inpt,opts) {
    try{
      return native.parser.js._parse(inpt,opts);
    } catch (error) {
      error.code = '\n' + native.string.getLines(inpt,error.loc.line,error.loc.line) + '\n' + ' '.repeat(error.loc.column) + '^';
      error.message += ': ' + error.code;
      throw error;
    }
  };
});
//native.parser.js.traverse = require('estraverse').traverse;
defineNative(native.parser.js,'traverse','estraverse','traverse');
//native.parser.js.merge = require('estraverse').attachComments;
defineNative(native.parser.js,'merge','estraverse','attachComments');
//native.parser.js.utils = require('esutils');
defineNative(native.parser.js,'utils','esutils');
//native.parser.js.codegen = require('escodegen').generate;
defineNative(native.parser.js,'codegen','escodegen','generate');
native.parser.js.sourcemap = {};
//native.parser.js.sourcemap.helper = require('source-map');
defineNative(native.parser.js.sourcemap,'helper','source-map');
//native.parser.js.sourcemap.support = require('source-map-support');
defineNative(native.parser.js.sourcemap,'support','source-map-support');
//native.parser.js.sourcemap.convert = require('convert-source-map');
defineNative(native.parser.js.sourcemap,'convert','convert-source-map');
//native.parser.js.sourcemap.concat = require('concat-with-sourcemaps-next');
defineNative(native.parser.js.sourcemap,'concat','concat-with-sourcemaps-next');
//native.parser.js.esnext = require('babel-core');
defineNative(native.parser.js,'esnext','babel-core');
//native.parser.js.minifier = require('uglify-js');
defineNative(native.parser.js,'minifier','uglify-js');
//native.uuid = require('node-uuid');
defineNative(native,'uuid','node-uuid');
//native.mail = require('nodemailer');
defineNative(native,'mail','nodemailer');
//native.async = require('neo-async');
defineNative(native,'async','neo-async');
//native.watch = require('node-watch');
defineNative(native,'watch','node-watch');
native.validator = {};
//native.validator.json = require('is-my-json-valid');
defineNative(native.validator,'json','is-my-json-valid');
native.match = {};
//native.match.mini = require('minimatch');
defineNative(native.match,'mini','minimatch');
native.compression = {};
//native.compression.pson = require('pson');
defineNative(native.compression,'pson','pson');
native.object = {};
//native.object.diff = require('deep-diff').diff;
defineNative(native.object,'diff','deep-diff','diff');
//native.object.fast = require('to-fast-properties');
defineNative(native.object,'fast','to-fast-properties',function(){
  native.object._fast = native.object.fast;
  native.object.fast = function(obj,deep){
    if (deep !== true) {
      native.object._fast(obj);
    } else {
      var cache = [];
      JSON.stringify(obj,function(key,value){
        if(cache.indexOf(value) === -1) {
          cache.push(value);
          if (isNaN(key) === true && value != null && value.constructor === Object && Object.keys(value).length > 0) {
            native.object._fast(value);
          }
        }
        return value;
      });
      cache = null;
    }
  };
});
native.string = {};
native.string.getLines = function(data, from, toIncluding) {
  var i = 0, j = 0;
  data = '\n' + data;
  --from;
  while (from-->0 && i !== -1)
    --toIncluding, i = data.indexOf('\n', i + 1);
  if (i === -1) return '';
  j = i;
  while (toIncluding-->0 && j !== -1)
    j = data.indexOf('\n', j + 1);
  if (j === -1) j = data.length;
  return data.slice(i + 1, j);
};
native.monitor = {};
//native.monitor.uv = require('event-loop-lag');
defineNative(native.monitor,'uv','event-loop-lag');
//native.sysconf = require('sysconfx-next');
defineNative(native,'sysconf','sysconfx-next');
if (process.platform === 'win32') {
  //native.perfcounter = require('cwinperfcounter-next');
  defineNative(native, 'perfcounter', 'cwinperfcounter-next');
}
//native.winston = require('winston');
defineNative(native,'winston','winston');
//native.send = require('send');
defineNative(native,'send','send');
//native.smtp = require('nodemailer-smtp-pool');
defineNative(native,'smtp','nodemailer-smtp-pool');
//native.memwatch = require('memwatch-next');
defineNative(native,'memwatch','memwatch-next');
//native.database = require('loopback-datasource-juggler');
defineNative(native,'database','loopback-datasource-juggler');
//native.metascript = require('metascript');
defineNative(native,'metascript','metascript');

// injecting core HTML5 classes implementation (we like a mirrored environment)
//TODO: test W3C compliance for Worker
//global.Worker = require('webworker-threads').Worker;
defineNative(global,'Worker','webworker-threads','Worker');
//TODO: test W3C compliance  for WebSocket
//global.WebSocket = require('ws');
defineNative(global,'WebSocket','ws');
//TODO: test W3C compliance for XMLHttpRequest
//global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
defineNative(global,'XMLHttpRequest','xmlhttprequest','XMLHttpRequest');
//TODO: add localStorage/indexDB emulation?

global.require.uncache = require('require-uncache');
defineNative(global.require,'uncache','require-uncache');

native.parser.js.sourcemap.support.install();

native.json = {};
native.json.stringify = JSON.stringify;
native.json.serialize = require('json-stringify-safe').getSerialize;
JSON.stringify = function (obj, fn, spaces, decycle) {
  return native.json.stringify(obj, native.json.serialize(fn, decycle), spaces);
};

// creating global platform-wide exception object for managed error handling/remoting
global.Exception = function(messageOrObject){
  var formatted_message = null;
  var arguments_array = Array.prototype.slice.call(arguments);
  var name = 'Exception';
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
    //delete messageOrObject.data;
    //delete messageOrObject.dump;
    //delete messageOrObject.block;
    //delete messageOrObject.stack;
    for (var key in messageOrObject) {
      this[key] = messageOrObject[key];
    }
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
    var internal_error = new Error(formatted_message);
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
    'stack': this.stack
  };
};
Object.defineProperty(global.Error.prototype,'toJSON', { 'enumerable': false });

// referencing native node console
native.console = {};
['trace', 'log', 'warn', 'info', 'error', 'dir'].forEach(function (level) {
  native.console[level] = console[level];
});

// adding emulation for console.debug
console.debug = console.log;
native.console.debug = native.console.log;

// workaround until iojs/node and V8 devs decide to support domain propagation
native.promise = global.Promise;
delete global.Promise;
//global.Promise = require('bluebird');

// loading ECMAScript 6/7 polyfill
require('babel-core/polyfill');

native.util.makeHybridCallbackPromise = function(callback, noreject){
  var hybrid_callback;
  var promise, resolve, reject;
  if (typeof callback === 'function') {
    hybrid_callback = callback;
    hybrid_callback.promise = undefined;
    hybrid_callback.resolve = function(result){
      if (noreject === true) {
        callback(result);
      } else {
        callback(null,result);
      }
    };
    hybrid_callback.reject = callback;
  } else {
    promise = new Promise(function(native_resolve,native_reject){
      resolve = native_resolve;
      reject = native_reject;
    });
    hybrid_callback = function (error, result) {
      if (error != null) {
        reject(error);
      } else {
        resolve(result);
      }
    };
    hybrid_callback.promise = promise;
    hybrid_callback.resolve = resolve;
    if (noreject === true) {
      hybrid_callback.reject = resolve;
    } else {
      hybrid_callback.reject = reject;
    }
  }
  return hybrid_callback;
};

native.eval = function(code,esnext,silent){
  var now_label = (new Date()).toCompactString();
  var generated_path = native.path.join(native.compile.basepath,'../tmp/eval/eval.' + now_label + '.built.js');
  var source_path = native.path.join(native.compile.basepath,'../tmp/eval/eval.' + now_label + '.source.js');
  if (esnext !== false) {
    if (silent !== true) {
      console.debug('native compiling code', code);
    }
    // getting file source code and transpiling to support ECMAScript 6/7
    var comments = [];
    var tokens = [];
    var ast = native.parser.js.parse(code, {
      'allowImportExportEverywhere': false,
      'allowReturnOutsideFunction': true,
      'ecmaVersion': 7,
      'playground': false,
      'strictMode': false,
      'onComment': comments,
      'locations': true,
      'onToken': tokens,
      'ranges': true,
      'preserveParens': false,
      'sourceFile': source_path
    });
    native.parser.js.merge(ast, comments, tokens);
    native.parser.js.traverse(ast,{
      'enter': function(node,parent){
        delete node.trailingComments;
      }
    });
    var generated = native.parser.js.esnext.transform.fromAst(ast, null, {
      'stage': 1,
      'compact': false,
      'sourceMaps': true,
      'sourceFileName': source_path,
      'code': true,
      'ast': false,
      'optional': native.compile.optional
    });
    generated.map.sourcesContent = [ code ];
    native.fs.ensureDirSync(native.path.dirname(generated_path));
    var sourcemap_comment = '//# sourceMappingURL=' + native.path.basename(generated_path) + '.map';
    native.fs.writeFileSync(generated_path + '.map', JSON.stringify(generated.map));
    var sourcemap_comment = native.parser.js.sourcemap.convert.fromObject(generated.map).toComment();
    native.fs.writeFileSync(generated_path, generated.code + '\n' + sourcemap_comment);
    if (silent !== true) {
      console.debug('native optimizing code', code);
    }
    var minified = native.parser.js.minifier.minify(generated.code, {
      //inSourceMap: generated.map,
      //outSourceMap: native.path.basename(generated_path) + '.map',
      mangle: false,
      compress: true,
      //sourceMapIncludeSources: true,
      fromString: true
    });
    native.fs.writeFileSync(generated_path + '.min', minified.code);
    //native.fs.writeFileSync(generated_path + '.map', minified.map);
    native.memwatch.gc();
  }
  try {
    // injecting code
    if (silent !== true) {
      console.debug('native evaluating code',code);
    }
    return global.require(generated_path + ((global.development === false) ? '.min' : ''));
  } catch (err) {
    throw new Exception(err, 'error compiling code', code);
  }
};

native.compile = function(path,base,tag,esnext,silent){
  var source_path = native.path.join(base,path);
  var source_code = native.fs.readFileSync(source_path, { 'encoding': 'utf8' });
  var tag_extention = (tag==null) ? '' : ('.' + tag);
  if (native.compile.scope != null){
    var meta_code = native.metascript.transform(source_code, source_path, native.compile.scope,true);
    if (source_code !== meta_code){
      var meta_path = native.path.join(native.compile.basepath, path) + tag_extention + '.meta';
      native.fs.ensureDirSync(native.path.dirname(meta_path));
      native.fs.writeFileSync(meta_path, meta_code);
      source_code = meta_code;
    }
  }
  var generated_path = source_path;
  if (esnext !== false) {
    var skip = false;
    var source_stat = native.fs.statSync(source_path);
    generated_path = native.path.join(native.compile.basepath,path) + tag_extention;
    if (native.fs.existsSync(generated_path) === true){
      // workaround for fs.utimesSync not preserving milliseconds
      if (parseInt(native.fs.statSync(generated_path).mtime.getTime()/1000) === parseInt(source_stat.mtime.getTime()/1000)){
        skip = true;
      }
    }
    if (skip === false) {
      if (silent !== true) {
        console.debug('native compiling %s',source_path);
      }
      // getting file source code and transpiling to support ECMAScript 6/7
      var comments = [];
      var tokens = [];
      var ast = native.parser.js.parse(source_code, {
        'allowImportExportEverywhere': false,
        'allowReturnOutsideFunction': true,
        'ecmaVersion': 7,
        'playground': false,
        'strictMode': false,
        'onComment': comments,
        'locations': true,
        'onToken': tokens,
        'ranges': true,
        'preserveParens': false,
        'sourceFile': source_path + tag_extention
      });
      native.parser.js.merge(ast, comments, tokens);
      native.parser.js.traverse(ast,{
        'enter': function(node,parent){
          delete node.trailingComments;
        }
      });
      var generated = native.parser.js.esnext.transform.fromAst(ast, null, {
        'stage': 1,
        'compact': false,
        'sourceMaps': true,
        'sourceFileName': source_path + tag_extention,
        'code': true,
        'ast': false,
        'optional': native.compile.optional
      });
      generated.map.sources = [ native.path.relative(generated_path,source_path).replace(/\\/g,'/').replace('../','') ];
      generated.map.sourcesContent = [ source_code ];
      native.fs.ensureDirSync(native.path.dirname(generated_path));
      var sourcemap_comment = '//# sourceMappingURL=' + native.path.basename(generated_path) + '.map';
      native.fs.writeFileSync(generated_path + '.map', JSON.stringify(generated.map));
      native.fs.utimesSync(generated_path + '.map', source_stat.atime, source_stat.mtime);
      native.fs.writeFileSync(generated_path, generated.code + '\n' + sourcemap_comment);
      native.fs.utimesSync(generated_path, source_stat.atime, source_stat.mtime);
      if (silent !== true) {
        console.debug('native compiling %s', source_path);
      }
      var minified = native.parser.js.minifier.minify(generated.code, {
        //inSourceMap: generated.map,
        //outSourceMap: native.path.basename(generated_path) + '.map',
        mangle: false,
        compress: true,
        comments: 'all',
        //sourceMapIncludeSources: true,
        fromString: true
      });
      native.fs.writeFileSync(generated_path + '.min', minified.code);
      //native.fs.writeFileSync(generated_path + '.map', minified.map);
      native.fs.utimesSync(generated_path, source_stat.atime, source_stat.mtime);
      //native.fs.utimesSync(generated_path + '.map', source_stat.atime, source_stat.mtime);
      native.memwatch.gc();
    }
  }
  try {
    // injecting code
    if (silent !== true) {
      console.debug('native loading %s',source_path);
    }
    return global.require(generated_path + ((global.development === false) ? '.min' : ''));
  } catch (err) {
    throw new Exception(err, 'error compiling %s', source_path);
  }
};
native.compile.optional = [];
/*try {
  eval("(function*(){})()");
  native.compile.optional.push('asyncToGenerator');
} catch(err){}*/
native.compile.basepath = native.path.join(global.main.path.root,'build');
native.compile.scope = {
  // order is important to make development branches run
  //? if (DIST) {
  'DIST': true,
  //? } else {
  'DIST': false,
  //? }
  'CLUSTER': false
};
native.compile.init = function(){
  //? if (!DIST) {
  // cleaning cache/build when building boot/core packs
  if (process.env.BUILD === 'pack'){
    if (native.cluster == null || (native.cluster != null && native.cluster.isMaster === true)) {
      console.debug('cleaning for new build');
      native.fs.removeSync(native.path.join(global.main.path.root,'/build/'));
      native.fs.removeSync(native.path.join(global.main.path.root,'/cache/'));
      if (native.cluster == null) {
        native.fs.removeSync(native.path.join(global.main.path.root,'/dist/core/'));
      } else {
        native.fs.removeSync(native.path.join(global.main.path.root,'/dist/cluster/'));
      }
    }
  }

  // cleaning cache/build on compile scope changed
  var scope_path = native.path.join(native.compile.basepath,'meta.define');
  if (native.cluster == null || (native.cluster != null && native.cluster.isMaster === true)) {
    if (native.fs.existsSync(scope_path) === true) {
      if (native.object.diff(native.compile.scope, JSON.parse(native.fs.readFileSync(scope_path, {encoding: 'utf-8'}))) != null) {
        console.debug('cleaning for operating model switch');
        native.fs.removeSync(native.path.join(global.main.path.root,'/build/'));
        native.fs.removeSync(native.path.join(global.main.path.root,'/cache/'));
      }
    }
    if (native.fs.existsSync(scope_path) === false) {
      native.fs.ensureDirSync(native.compile.basepath);
      native.fs.writeFileSync(scope_path, JSON.stringify(native.compile.scope));
    }
  }
  //? }
};

native.sleep = global.sleep = function (ms) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, ms)
  });
};

native.sleepUntil = global.sleepUntil = function(callback, interval){
  return new Promise(function (resolve, reject) {
    var check = function(){
      if (typeof callback === 'function') {
        var result = callback();
        if (result != null && result.constructor === Promise) {
          result.then(function(result){
            if (result === true) {
              resolve();
            } else {
              setTimeout(check, interval);
            }
          }).catch(function(){
            setTimeout(check, interval);
          });
        } else if (result === true) {
          resolve();
        } else {
          setTimeout(check, interval);
        }
      } else {
        resolve();
      }
    };
    setTimeout(check, interval);
  });
};

['global', 'process', 'GLOBAL', 'root', 'Buffer', 'require', 'Schema', 'Worker', 'WebSocket', 'XMLHttpRequest', 'Exception', '_babelPolyfill', 'core', 'Reflect', 'regeneratorRuntime', 'data'].forEach(function(key){
  if (Object.getOwnPropertyDescriptor(global,key) != null) {
    Object.defineProperty(global,key,{ 'enumerable': false });
  }
});
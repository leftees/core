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

//C: creating native namespace with references to node-specific modules
global.native = {};

//C: loading native modules and node-specific ones
native.semver = require('semver');
native.domain = require('domain');
native.fs = require('fs-extra');
native.stream = require('stream');
native.net = require('net');
native.path = require('path');
native.util = require('util');
native.url = require('url');
native.querystring = require('querystring');
native.useragent = require('useragent');
//T: fix update path for global installations
//native.useragent(true);
require('useragent/features');
native.http = require('http');
native.https = require('https');
native.httpauth ={};
native.httpauth.basic = require('http-auth').basic;
native.httpauth.digest = require('http-auth').digest;
native.crypto = require('crypto');
native.websocket = {};
native.websocket.server = require('ws').Server;
native.args = require('yargs').argv;
native.cli = {};
native.cli.color = require('cli-color');
if (native.semver.satisfies(native.semver.clean(process.version),'0.10.0 - 0.11.11') === true) {
  native.zlib = require(global.main.path.core + '/core/backport/zlib/zlib.js');
} else {
  native.zlib = require('zlib');
}
native.body = {};
native.body.text = require('body');
native.body.json = require('body/json');
native.body.form = require('body/form');
native.body.multipart = require('multiparty').Form;
native.cookie = require('cookie');
native.cookie.create = native.cookie.serialize;
native.cookie.serialize = function(data){
  var result = [];
  Object.keys(data).forEach(function(name){
    result.push(name+'='+data[name]);
  });
  return result.join('; ');
};
native.cookie._signature = require('cookie-signature');
native.cookie.sign = native.cookie._signature.sign;
native.cookie.unsign = native.cookie._signature.unsign;
native.dom = {};
native.dom.html = require('jsdom');
native.dom.html.defaultDocumentFeatures = {
  FetchExternalResources: false,
  ProcessExternalResources: false
};
native.dom.html = native.dom.html.jsdom;
native.dom.xml = require('libxmljs').parseXml;
native.request = require('request');
native.moment = require('moment');
native.parser = {};
native.parser.js = {};
native.parser.js.parse = require('esprima').parse;
native.parser.js.traverse = require('estraverse').traverse;
native.parser.js.utils = require('esutils');
native.parser.js.codegen = require('escodegen').generate;
native.parser.js.sourcemap = require('source-map');
native.uuid = require('node-uuid');
native.metrics = require('measured');
native.mail = require('nodemailer');

//C: injecting core HTML5 classes implementation (we like a mirrored environment)
//T: test W3C compliance for Worker
global.Worker = require('webworker-threads').Worker;
//T: test W3C compliance  for WebSocket
global.WebSocket = require('ws');
//T: test W3C compliance for XMLHttpRequest
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//T: add localStorage/indexDB emulation?

//C: creating global platform-wide exception object for managed error handling/remoting
global.Exception = function(message){
  //C: getting message argument
  var formatted_message = message;
  //C: sanitizing message to 'unknown' if missing
  if (formatted_message == null) {
    formatted_message = 'unknown';
  }
  //C: getting formatted message from arguments (emulating behavior of console.log)
  var arguments_array = Array.prototype.slice.call(arguments);
  if (arguments_array.length > 0){
    formatted_message = native.util.format.apply(native.util,arguments_array);
  }
  //C: removing original message from arguments
  if (arguments_array.length > 0) {
    arguments_array.shift();
  }
  var error = new Error(formatted_message);
  //C: storing arguments as exception data
  error.data = arguments_array;
  //C: initializing dump as null (will be populated by embedded runtime debugger)
  error.dump = null;
  //C: patching stack
  error.stack = error.stack.replace(/\n\s*?at new global\.Exception.*?\n/,'\n');
  return error;
};
//C: overriding toString() function to provide Error emulation
global.Exception.prototype.toString = function(){
  return this.message;
};

//C: referencing native node console
native.console = {};
['log', 'warn', 'info', 'error', 'dir'].forEach(function (level) {
  native.console[level] = console[level];
});

//C: adding emulation for console.debug
native.console.debug = native.console.log;

//C: defining centralized print with level and color support (xterm int code as second argument)
console.print = function (level,color,args) {
  var formatted_message = native.util.format.apply(native.util, args);
  /*var now = Date.now();
  var elapsed = now - console.print._lasttime;
  console.print._lasttime = now;
  if (global.hasOwnProperty('platform') === true){
    formatted_message = '[' + native.moment(now).format('YYYY-MM-DD HH:mm:ss.SSS') + '] [+' + Number.toHumanTime(elapsed) + '] [' + level + '] ' + formatted_message;
  }*/
  return native.console[level](native.cli.color.xterm(color)(formatted_message));
};
console.print._lasttime = null;

//C: replacing console.log with coloured implementation
console.log = function () {
  console.print('log',7, Array.prototype.slice.call(arguments));
};

//C: replacing console.warn with coloured implementation
console.warn = function () {
  console.print('warn',220, Array.prototype.slice.call(arguments));
};

//C: replacing console.info with coloured implementation
console.info = function () {
  console.print('info',32, Array.prototype.slice.call(arguments));
};

//C: replacing console.error with coloured implementation
console.error = function () {
  console.print('error',1, Array.prototype.slice.call(arguments));
};

//C: replacing or defining console.debug with coloured implementation
console.debug = function () {
  console.print('debug',8, Array.prototype.slice.call(arguments));
};

//C: creating supported CLI commands hashtable (will be populated afterwards)
global.main.commands = {};

//C: defining legacy unknown CLI command (will be overridden by modular commands loading)
global.main.commands.unknown = function(){
  console.error('unsupported command');
};

//C: defining legacy test_ci CLI command (will be overridden by modular commands loading)
global.main.commands.test = function(){
  console.error('unsupported command');
};

//C: populating supported CLI commands from /core/main folder (whether exists)
if (native.fs.existsSync(native.path.join(global.main.path.core,'/core/main')) === true) {
  //C: getting files available in /core/main folder
  var exec_files = native.fs.readdirSync(native.path.join(global.main.path.core,'/core/main'));
  //C: caching .js extension check regex
  var js_file_check = /.js$/;
  //C: loading every .js files available in /core/main folder
  exec_files.forEach(function (file) {
    if (js_file_check.test(file) === true && (js_file_check.lastIndex = 0) === 0) {
      global.require.main._compile('\n' + native.fs.readFileSync(global.main.path.core + '/core/main/' + file, { encoding: 'utf-8' }), 'app:///core/main/' + file);
    }
  });
}

//C: detecting CLI command requested by user
var target_command = global.main.commands[native.args._[0]];
//C: checking whether command doesn't exist or it's not executable
if (!(target_command != null && typeof target_command === 'function')){
  if (global.testing === false) {
    //C: selecting unknown command by default (hopefully overridden by loaded modular commands)
    target_command = global.main.commands.unknown;
  } else {
    //C: selecting test command by default (hopefully overridden by loaded modular commands)
    target_command = global.main.commands.test(true);
  }
}

//C: executing CLI command
target_command();
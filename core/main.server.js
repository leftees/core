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
native.fs = require('fs');
native.path = require('path');
native.util = require('util');
native.args = require('yargs').argv;
native.cli = {};
native.cli.color = require('cli-color');

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
  if (formatted_message === null || formatted_message === undefined) {
    formatted_message = 'unknown';
  }
  //C: getting formatted message from arguments (emulating behavior of console.log)
  var arguments_array = Array.prototype.slice.call(arguments);
  if (arguments_array.length > 0){
    formatted_message = native.util.format.apply(native.util,arguments_array);
  }
  //C: assigning formatted message to this instance
  this.message = formatted_message;
  //C: removing original message from arguments
  if (arguments_array > 0) {
    arguments_array.shift();
  }
  //C: storing arguments as exception data
  this.data = arguments_array;
};
//C: overriding toString() function to provide Error emulation
global.Exception.prototype.toString = function(){
  return this.message;
};

//C: referencing native node console
native.console = {};
['log', 'warn', 'info', 'error', 'dir'].forEach(function(level) {
  native.console[level] = console[level];
});

//C: replacing console.log with coloured implementation
console.log = function(){
  var formatted_message = native.util.format.apply(native.util,Array.prototype.slice.call(arguments));
  native.console.log(native.cli.color.xterm(7)(formatted_message));
};

//C: replacing console.warn with coloured implementation
console.warn = function(){
  var formatted_message = native.util.format.apply(native.util,Array.prototype.slice.call(arguments));
  native.console.log(native.cli.color.xterm(220)(formatted_message));
};

//C: replacing console.info with coloured implementation
console.info = function(){
  var formatted_message = native.util.format.apply(native.util,Array.prototype.slice.call(arguments));
  native.console.log(native.cli.color.xterm(32)(formatted_message));
};

//C: replacing console.error with coloured implementation
console.error = function(){
  var formatted_message = native.util.format.apply(native.util,Array.prototype.slice.call(arguments));
  global.native.console.log(native.cli.color.xterm(1)(formatted_message));
};

//C: replacing or defining console.debug with coloured implementation
console.debug = function(){
  var formatted_message = native.util.format.apply(native.util,Array.prototype.slice.call(arguments));
  native.console.log(native.cli.color.xterm(8)(formatted_message));
};

//C: creating temporary main namespace for modular CLI command support
global.main = {};

//C: creating supported CLI commands hashtable (will be populated afterwards)
global.main.commands = {};

//C: defining legacy help CLI command (will be overridden by modular commands loading)
global.main.commands.help = function(){
  console.error('unsupported command');
};

//C: populating supported CLI commands from /core/main folder (whether exists)
if (native.fs.existsSync(native.path.join(process.cwd(),'core/main')) === true) {
  //C: getting files available in /core/main folder
  var exec_files = native.fs.readdirSync(native.path.join(process.cwd(),'core/main'));
  //C: caching .js extension check regex
  var js_file_check = /.js$/;
  //C: loading every .js files available in /core/main folder
  exec_files.forEach(function (file) {
    if (js_file_check.test(file) === true) {
      global.require('./core/main/' + file);
    }
  });
}

//C: detecting CLI command requested by user
var target_command = global.main.commands[native.args._[0]];
//C: checking whether command doesn't exist or it's not executable
if (!(target_command !== undefined && typeof target_command === 'function')){
  //C: selecting help command by default (hopefully overridden by loaded modular commands)
  target_command = global.main.commands.help;
}

//C: executing CLI command
target_command();

//C: deleting global.main namespace
delete global.main;

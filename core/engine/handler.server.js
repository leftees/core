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

platform.engine.handlers = platform.engine.handlers || {};

platform.engine.handlers._store = {};

platform.engine.handlers.register = function(name,options){
  if (platform.engine.handlers.exist(name) === false) {
    var handler = options;

    switch(handler.type){
      case 'fastcgi':
      case 'proxy':
        if (handler.daemon != null && handler.daemon.bin != null){
          if (handler.daemon.root != null && handler.daemon.root.startsWith(ntive.path.sep) === false){
            handler.daemon.root = platform.io.map(handler.daemon.root);
          }
          handler._process = require('child_process').spawn(handler.daemon.bin, handler.daemon.args||[],{ 'cwd': handler.daemon.root });
        }
        break;
    }

    platform.engine.handlers._store[name] = handler;
  } else {
    throw new Exception('handler %s already exists',name);
  }
};

platform.engine.handlers.unregister = function(name){
  if (platform.engine.handlers.exist(name) === true) {
    var handler = platform.engine.handlers._store[name];

    //T: store statistics
    //T: raise event

    if (platform.configuration.server.debugging.handler === true) {
      console.debug('handler %s unregistered', name);
    }

    switch(handler.type){
      case 'fastcgi':
      case 'proxy':
        if (handler._process != null){
          handler._process.kill();
          handler._process = undefined;
        }
        break;
    }

    delete (platform.engine.handlers._store[name]);
  } else {
    throw new Exception('handler %s does not exist',name);
  }
};

platform.engine.handlers.list = function(){
  return Object.keys(platform.engine.handlers._store);
};

platform.engine.handlers.exist = function(name){
  return (platform.engine.handlers._store.hasOwnProperty(name));
};

platform.engine.handlers.get = function(name){
  if (platform.engine.handlers.exist(name) === true) {
    return platform.engine.handlers._store[name];
  } else {
    throw new Exception('handler %s does not exist',name);
  }
};

platform.engine.handlers.resolve = function(request){
  var cleaned_url = request.url;
  var query_marker = cleaned_url.indexOf('?');
  if (query_marker > -1) {
    cleaned_url = cleaned_url.substr(0, query_marker);
  }

  for(var name in platform.engine.handlers._store) {
    if (platform.engine.handlers._store.hasOwnProperty(name) === true) {
      var handler = platform.engine.handlers._store[name];

      if (handler.filter != null) {
        //C: checking match against string
        if (typeof handler.filter === 'string') {
          if (cleaned_url === handler.filter) {
            return name;
          }
          //C: checking match against function
        } else if (typeof handler.filter === 'function') {
          if (handler.filter() === true) {
            return name;
          }
          //C: checking match against regexp
        } else if (handler.filter.constructor === RegExp) {
          if (handler.filter.test(cleaned_url) === true) {
            return name;
          }
        }
      }
    }
  }
};

platform.engine.handlers.process = function(name){

};

platform.engine.handlers._init = function(){

};

//T: move init and HTTP(S) start in PXE events
platform.engine.handlers._init();
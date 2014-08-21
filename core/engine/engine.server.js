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

//N: Provides server-side specific classes and namespaces.
platform.engine = platform.engine || {};

//O: Provides process implementations.
platform.engine.process = {};

platform.engine.process.auth = {};

platform.engine.process.auth.url = function(url){
  if (platform.configuration.server.http.default.reject.url.test(url) === true) {
    return false;
  }
  return true;
};

platform.engine.process.auth.basic = function(realm,username,password,callback){
  callback(password === 'password');
};

platform.engine.process.auth.digest = function(realm,username,callback){
  var md5 = native.crypto.createHash('md5');
  md5.update(username + ':' + realm + ':' + 'password');
  var digest = md5.digest('hex');
  callback(digest);
};

//F: Processes an HTTP request.
platform.engine.process.http = function (request, response, server) {
  var secure = server.secure;
  var debug = server.debug;
  var port = server.port;
  var count = request.id;
  var remoteAddress = request.client.address;
  var remotePort = request.client.port;

  //T: handler

  //T: is session valid
  var session = null;

  //T: get identity
  var identity = null;

  platform.server.http.context.create(request, response, server, session, identity, function(err,context){
    native.domain.active.__context__ = context;
    platform.engine.process.call();
  });

  //T: check if exists

  //T: check if protected

  //T: check if restful

  //T: process file


};

platform.engine.process.call = function(){
  context.response.end();
};

platform.engine.process.restful = function(){
  context.response.end();
};

platform.engine.process.file = function(){
  context.response.end();
};

//F: Processes a new WebSocket.
//A: request: Specifies the request object to be processed.
//A: websocket: Specifies the socket object to be processed.
platform.engine.process.websocket = function (request, server, websocket) {
  var secure = server.secure;
  var debug = server.debug;
  var port = server.port;
  var count = request.id;
  var remoteAddress = request.client.address;
  var remotePort = request.client.port;
  //websocket.close();
};
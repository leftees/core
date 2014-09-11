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

if(platform.engine.id == null) {
  platform.engine.id = native.uuid.v1();

  Object.defineProperty(platform.engine, "id", {
    configurable: false,
    enumerable: true,
    writable: false
  });
}

platform.engine.send = {};

platform.engine.send.cache = function(path,tag){
  if (platform.io.cache.is(path,tag) === true) {
    var request = context.request;
    var response = context.response;
    var server = context.server;

    //T: get last-modified/content-length for header

    var content_type = platform.configuration.server.http.default.mimetypes[native.path.extname(path)] || 'text/plain';
    response.setHeader("Content-Type", content_type);
    response._async = true;

    var data_stream = null;
    if (server.compression.enable === true && request.headers ['accept-encoding'] != null && request.headers ['accept-encoding'].contains ('gzip') === true) {
      response.setHeader('Content-Encoding', 'gzip');
      data_stream = platform.io.cache.get.stream(path, tag, false);
    } else {
      data_stream = platform.io.cache.get.stream(path, tag, true);
    }
    if (request.method === 'HEAD') {
      response.end();
    } else {
      data_stream.pipe(response);
    }
  } else {
    //T: throw error?
  }
};

//O: Provides process implementations.
platform.engine.process = {};

//O: Provides auth implementations.
platform.engine.process.auth = {};

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
platform.engine.process.http = function () {
  var request = context.request;
  var response = context.response;
  var call = context.call;
  var server = context.server;

  //T: check session is valid and get session object
  var session = null;
  if ((request.headers['x-platform-session'] != null && request.headers['x-platform-token'] != null) || (call.arguments['auth_session'] != null && call.arguments['auth_token'])) {
    var session_id = request.headers['x-platform-session'] || call.arguments['auth_session'];
    var session_token = request.headers['x-platform-token'] || call.arguments['auth_token'];
    if (platform.session.exist(session_id) === true) {
      session = platform.session.get(session_id);
      if (session != null && session.identity.token === session_token) {
        if (session._session.timeout > 0) {
          if (session.state === 0) {
            session._session.timeout = platform.configuration.engine.session.gc.state.http;
            session.state = 1;
            platform.statistics.counter('sessions.gen1').inc();
            platform.statistics.counter('sessions.gen0').dec();
            if(platform.configuration.server.debugging.session === true) {
              console.debug('session %s moved to state 1 (http alive)', session.name);
            }
            //T: reauthenticate request from server?
          }
          session._session.lease = Date.now() + session._session.timeout;
        }
      } else {
        //T: log intrusion attempt?
        session = null;
      }
    }
  }
  if (session == null && context.request.headers ["x-platform-bootstrap"] != null) {
    var bootstrap_id = request.headers['x-platform-bootstrap'] || call.arguments['auth_bootstrap'];
    if (platform.client.bootstrap.isValid(bootstrap_id) === true) {
      if (platform.client.bootstrap.exist(bootstrap_id) === true) {
        session = platform.client.bootstrap.get(bootstrap_id);
        if (session != null){
          session._session.lease = Date.now() + session._session.timeout;
        }
      }
    }
  }
  context.session = session;

  if (session != null) {
    session._session.working++;
    request.on('end',function(){
      session._session.working--;
    });
  }

  //T: get identity
  var identity = null;
  if (session != null) {
    //T: migrate classes and integrity checks from 0.3.x branch
    identity = session.identity._store;
  }
  context.identity = identity;

  //C: handling url path
  switch(call.url.pathname){
    case '/':
      platform.kernel.get(platform.configuration.client.bootstrap.root)();
      return;
    case '/-':
      platform.kernel.get(platform.configuration.client.bootstrap.loader)();
      return;
  }

  try {
    var target = platform.kernel.get(call.url.pathname, null, '/');
    var skip = false;

    //T: check if protected/unprotected

    if (skip === false) {
      call.data.get(function(err){
        //T: handle errors
        platform.engine.process.restful(target);
      });
    } else {
      platform.engine.process.fallback();
    }
  } catch(err) {
    platform.engine.process.fallback();
  }

};

platform.engine.process.fallback = function(){
  var handler = platform.engine.handlers.resolve(context.request);

  if (handler != null) {
    platform.engine.handlers.process(handler);
  } else {
    platform.engine.process.file();
  }
};

platform.engine.process.restful = function(target){
  var request = context.request;
  var response = context.response;
  var call = context.call;

  response.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
  response.setHeader('Pragma','no-cache');
  response.setHeader('Expires','0');

  try {
    switch (typeof target) {
      case 'function':
        var async_callback = false;
        var invoke_arguments = [];
        Function.info.arguments(target).forEach(function (argument) {
          if (argument === 'callback') {
            async_callback = true;
            response._async = true;
            invoke_arguments.push(function (err, result) {
              platform.engine.process.restful._callback(err,result);
            });
          } else {
            invoke_arguments.push(call.arguments[argument]);
          }
        });
        if (async_callback === false){
          var result = target.apply(target, invoke_arguments);
          if (result != null && (result.constructor === Error || result.constructor === Exception)) {
            platform.engine.process.restful._callback(result);
          } else{
            platform.engine.process.restful._callback(null, result);
          }
        } else {
          target.apply(target, invoke_arguments);
        }
        break;
    }
  } catch(err) {
    platform.engine.process.restful._callback(err);
  }
};

platform.engine.process.restful._callback = function(err,result){
  var request = context.request;
  var response = context.response;
  var server = context.server;

  response.setHeader('Content-Type','application/json');

  var content = null;
  if (err == null) {
    content = JSON.stringify({
      'result': result
    });
  } else {
    //T: return json, html or text depending on acceptable content type
    response.statusCode = 500;
    content = JSON.stringify({
      'error': err
    });
  }
  var content_length = content.length;

  var data_stream = response;
  if (server.compression.enable === true && content_length > server.compression.limit && request.headers ['accept-encoding'] != null && request.headers ['accept-encoding'].contains ('gzip') === true) {
    response.setHeader ('Content-Encoding', 'gzip');
    data_stream = native.zlib.createGzip();
    data_stream.pipe(response);
  }

  if (request.method !== 'HEAD') {
    data_stream.write(content);
  }
  data_stream.end();
};

platform.engine.process.file = function(){
  var request = context.request;
  var response = context.response;
  var server = context.server;
  var path = context.call.url.pathname;
  if (platform.io.exist(path) === true) {
    var file_info = platform.io.info(path);
    var last_modified = file_info.atime;
    var content_type = platform.configuration.server.http.default.mimetypes[native.path.extname(path)] || 'text/plain';
    var content_length = file_info.size;
    response.setHeader("Last-Modified", last_modified.toUTCString());
    response.setHeader("Content-Type", content_type);
    response.setHeader("Content-Length", content_length);
    response._async = true;
    var data_stream = platform.io.get.stream(path);
    if (server.compression.enable === true && content_length > server.compression.limit && request.headers ['accept-encoding'] != null && request.headers ['accept-encoding'].contains ('gzip') === true) {
      response.setHeader ('Content-Encoding', 'gzip');
      data_stream = data_stream.pipe(native.zlib.createGzip());
    }
    data_stream.pipe(context.response);
  } else {
    //C: returning 404 status code (for security reason we do not reply with 403/406)
    response.statusCode = 404;
    //T: return json, html or text depending on acceptable content type
    response.end ("404 File not found");
  }
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
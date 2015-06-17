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
 * Provides server-side specific classes and namespaces.
 * @namespace
*/
platform.engine = platform.engine || {};

/**
 * Provides process implementations.
 * @type {Object}
*/
platform.engine.process = {};

/**
 * Processes an HTTP request.
*/
platform.engine.process.http = async function () {
  var request = context.request;
  var response = context.response;
  var call = context.call;
  var server = context.server;


  var session = null;
  //TODO: check session is valid and get session object
  context.session = session;

  var identity = null;
  //TODO: get identity
  context.identity = identity;

  // handling url path
  switch(call.url.pathname){
    case '/':
      context.response.end();
      return;
    case '/-':
      context.response.end();
      return;
    case '/favicon.ico':
      context.response.end('');
      return;
  }

  if (platform.kernel.exists(call.url.pathname,null,'/') === true) {
    var target = platform.kernel.get(call.url.pathname, null, '/');
    var skip = false;

    //TODO: check if protected/unprotected

    if (skip === false) {
      if (request.method !== 'GET' && request.method != 'HEAD') {
        await call.data.fetch();
      }
      await platform.engine.process.restful(target);
      return;
    }
  }
  await platform.engine.process.fallback();
};

platform.engine.process.fallback = async function(){
  //var handler = platform.engine.handlers.resolve(context.request);

  //if (handler != null) {
    //platform.engine.handlers.process(handler);
  //} else {
    await platform.engine.process.file();
  //}
};

platform.engine.process.restful = async function(target){
  var request = context.request;
  var response = context.response;
  var server = context.server;
  var call = context.call;

  response.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
  response.setHeader('Pragma','no-cache');
  response.setHeader('Expires','0');

  switch (typeof target) {
    case 'function':
      //TODO: migrate to async property of functions (to support callback param injection)
      var result = target.apply(null, call.arguments);
      if (result != null && result.constructor === Promise) {
        response._async = true;
        result = await result;
      }
      response.setHeader('Content-Type','application/json');

      var content = null;
      content = JSON.stringify({
        'result': result
      });
      var content_length = content.length;

      var data_stream = response;
      if (server.compression.enable === true && content_length > server.compression.limit && request.headers ['accept-encoding'] != null && request.headers ['accept-encoding'].includes('gzip') === true) {
        response.setHeader ('Content-Encoding', 'gzip');
        data_stream = native.zlib.createGzip();
        data_stream.pipe(response);
      }

      if (request.method !== 'HEAD') {
        data_stream.write(content);
      }
      data_stream.end();
      break;
    default:
      context.response.end('not implemented');
      break;
  }
};

platform.engine.process.file = async function(){
  var request = context.request;
  var response = context.response;
  var server = context.server;
  var fullpath = (await platform.io.resolve(context.call.url.pathname)).fullpath;
  if (fullpath == null) {
    return;
  }

  var file_info = await platform.io.backends.system.info(fullpath);
  if (file_info.isFile() === false) {
    return;
  }

  response._async = true;

  var file_sender = native.send(request,native.path.basename(fullpath),{
    'dotfiles': 'ignore',
    'etag': true,
    'extensions': false,
    'index': false,
    'lastModified': true,
    'maxAge': 0,
    'root': native.path.dirname(fullpath)
  });

  var callback = native.util.makeHybridCallbackPromise();
  file_sender.on('error',function(error){
    callback(error);
  });
  file_sender.on('end',function(){
    callback();
  });

  //TODO: support abstract filesystem with stat.isAbstract()
  var data_stream = file_sender;
  if (server.compression.enable === true && file_info.size > server.compression.limit && request.headers['accept-encoding'] != null && request.headers['accept-encoding'].includes('gzip') === true) {
    //response.setHeader ('Content-Encoding', 'gzip');
    //TODO: support gzip through send transform
  }
  data_stream.pipe(response);

  await callback.promise;
};

/**
 * Processes a new WebSocket.
 * @param {} request Specifies the request object to be processed.
 * @param {} websocket Specifies the socket object to be processed.
*/
platform.engine.process.websocket = function (request, server, websocket) {
  var secure = server.secure;
  var debug = server.debug;
  var port = server.port;
  var count = request.id;
  var remoteAddress = request.client.address;
  var remotePort = request.client.port;
  websocket.close();
};
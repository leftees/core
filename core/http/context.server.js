'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

 result program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 result program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with result program.  If not, see <http://www.gnu.org/licenses/>.

 */

//N: Provides server-side specific classes and namespaces.
platform.server = platform.server || {};

//N: Provides HTTP web server management objects and methods.
platform.server.http = platform.server.http || {};

//N: Provides HTTP context classes.
platform.server.http.context = {};

//F: Create a context object for HTTP request processing.
//A: request: Specifies the current request object.
//A: response: Specifies the response object for current request.
//A: server: Specifies the server object for current request.
//A: session: Specifies the session object for current request.
//A: identity: Specifies the identity object for current request.
//A: callback<err,context>: Specifies the callback to be invoked when object is ready or error occurred.
//R: Returns a context object.
platform.server.http.context.create = function(request, response, server, session, identity, callback){
  //C: creating result object
  var result = {};

  //C: appending context objects
  result.request = request;
  result.response = response;
  result.server = server;
  result.session = session;
  result.identity = identity;

  //C: creating call object
  var call = result.call = {};

  //C: defining url object (parsed)
  call.url = native.url.parse(request.url,true);
  //C: extending url object with host from HTTP headers
  call.url.host = request.headers['host'];
  //C: extending url object with hostname extracted from HTTP headers
  if (typeof call.url.host === 'string' && call.url.host.indexOf(':') === -1) {
    call.url.hostname = request.headers['host'];
  } else {
    call.url.hostname = request.headers['host'].substr(0,call.url.host.indexOf(':'));
  }
  //C: extending url object with server port
  call.url.port = server.port;
  //C: extending url object with server protocol
  call.url.protocol = (server.secure === true) ? 'https:' : 'http:';
  //C: extending url object with uri (full uri without querystring)
  call.url.uri = call.url.protocol + '//' + call.url.host + call.url.pathname;
  //C: extending url object with origin extracted from HTTP headers
  call.url.origin = request.headers['origin'];
  //C: extending url object with referer extracted from HTTP headers
  call.url.referer = request.headers['referer'];
  //C: extracting origin from referer if missing
  if ((call.url.origin == null) && typeof call.url.referer === 'string') {
    call.url.origin = call.url.referer.replace(/http[s]{0,1}:\/\//,'').replace(/\/.*$/,'');
  }
  //C: extending call object with HTTP method
  call.method = request.method;

  //C: extending call object with invokable js strongname
  call.invoke = call.url.pathname.substr(1).replace(/\//g,'.');

  //C: extending call object with type extracted from ContentType header
  call.type = request.headers['content-type'];
  //C: cleaning from charset data (substr untill ';')
  if (typeof call.type === 'string' && call.type.indexOf(';') !== -1) {
    call.type = call.type.substr(0,call.type.indexOf(';'));
  }

  //C: extending call with arguments (querystring params)
  call.arguments = call.url.query;

  //C: creating object container for request body helper
  call.data = {};

  //C: getting request body length from HTTP headers
  call.data.length = request.headers['content-length'] || 0;

  //C: defining content object representation (assigned later)
  call.data.object = null;

  //C: generating request body if type is supported
  if (call.data.length > 0 && platform.server.http.context.bodyTypes.exist(call.type) === true) {
    //C: getting body parser by content type and executing
    platform.server.http.context.bodyTypes.get(call.type)(request,function(err,data){
      //C: returning error if any
      if (err) {
        callback(err);
        return;
      }
      //C: performing more data handling by type
      //T: move into parser specific code?
      switch(call.type) {
        case 'application/x-www-form-urlencoded':
        case 'application/json':
        case 'multipart/form-data':
          //C: extending call arguments object with content data
          call.arguments = {};
          Object.keys(data).forEach(function(name){
            call.arguments[name] = data[name];
          });
          Object.keys(call.url.query).forEach(function(name){
            call.arguments[name] = call.url.query[name];
          });
          //C: assigning object representation of object
          call.data.object = data;
          break;
        default:
          //C: assigning object representation of object
          call.data.object = data;
      }
      callback(null, result);
    });
  } else {
    callback(null, result);
  }
};

//T: migrate to contextify or similar for isolation?
//C: creating and enforcing global context namespace (using node domains for isolation)
Object.defineProperty(global,'context',{
  get: function(){
    //C: returning context object from active domain
    if (native.domain.active != null && native.domain.active.__context__ != null) {
      return native.domain.active.__context__;
    } else {
      return null;
    }
  },
  set: function(){},
  configurable: false
});

//N: Provides body parser classes and namespace.
platform.server.http.context.bodyTypes = {};

//V: Stores parser objects and instances.
platform.server.http.context.bodyTypes.__store__ = {};

//F: Registers a new body parser.
//A: type: Specifies the content type of the parser.
//A: parseFunction<request,callback>: Specifies the parser as function.
//R: Returns true if the parser is successfully registered.
platform.server.http.context.bodyTypes.register = function(type,parseFunction){
  if (platform.server.http.context.bodyTypes.exist(type) === false) {
    platform.server.http.context.bodyTypes.__store__[type] = parseFunction;
    return true;
  } else {
    throw new Exception('type \'%s\' already exists',type);
  }
};

//F: Unregisters a body parser for a content type.
//A: type: Specifies the content type of the parser to be unregistered.
//R: Returns true if the backend has been unregistered.
platform.server.http.context.bodyTypes.unregister = function(type){
  if (platform.server.http.context.bodyTypes.exist(type) === true) {
    return delete platform.server.http.context.bodyTypes.__store__[type];
  } else {
    throw new Exception('type \'%s\' does not exist',type);
  }
};

//F: Lists the content types registered.
//R: Returns an array of types registered.
platform.server.http.context.bodyTypes.list = function(){
  return Object.keys(platform.server.http.context.bodyTypes.__store__);
};

//F: Gets a body parser by content type.
//A: type: Specifies the content type of the parser to be returned.
//R: Returns the body parser function.
platform.server.http.context.bodyTypes.get = function(type){
  if (platform.server.http.context.bodyTypes.exist(type) === true) {
    return platform.server.http.context.bodyTypes.__store__[type];
  } else {
    throw new Exception('parser for \'%s\' not found',type);
  }
};

//F: Checks whether the parser is registered for a content type.
//A: type: Specifies the content type of the parser to be checked.
//R: Returns true if the body parser exists.
platform.server.http.context.bodyTypes.exist = function(type){
  return (platform.server.http.context.bodyTypes.__store__.hasOwnProperty(type) && typeof platform.server.http.context.bodyTypes.__store__[type] === 'function');
};

//C: registering body parser for text/plain (uses body node module)
platform.server.http.context.bodyTypes.register('text/plain',function(request,callback){
  //C: executing external module body with content size limit
  native.body.text(request,null,{
    limit: request.limit
  },callback);
});

//C: registering body parser for application/x-www-form-urlencoded (uses body node module)
platform.server.http.context.bodyTypes.register('application/x-www-form-urlencoded',function(request,callback){
  //C: executing external module body/form with content size limit
  native.body.form(request,null,{
    limit: request.limit
  },callback);
});

//C: registering body parser for application/json (uses body node module)
platform.server.http.context.bodyTypes.register('application/json',function(request,callback){
  //C: executing external module body/json with content size limit
  native.body.json(request,null,{
    limit: request.limit
  },callback);
});

//C: registering body parser for text/html (uses tuned jsdom node module)
platform.server.http.context.bodyTypes.register('text/html',function(request,callback){
  //C: executing external module body with content size limit
  native.body.text(request,null,{
    limit: request.limit
  },function(err,data){
    if (err) {
      callback(err);
      return;
    }
    try{
      //C: invoking callback with DOMDocument-related object as result
      callback(null,native.dom.html(data));
    } catch(err) {
      callback(err,data);
    }
  });
});

//C: registering body parser for text/xml (uses libxmljs node module)
platform.server.http.context.bodyTypes.register('text/xml',function(request,callback){
  //C: executing external module body with content size limit
  native.body.text(request,null,{
    limit: request.limit
  },function(err,data){
    if (err) {
      callback(err);
      return;
    }
    try {
      //C: invoking callback with XMLDocument-related object as result
      callback(null,native.dom.xml(data));
    }catch(err){
      callback(err,data);
    }
  });
});

//C: registering body parser for multipart/form-data (uses multiparty node module)
platform.server.http.context.bodyTypes.register('multipart/form-data',function(request,callback) {
  //C: instancing multipart parser with content size limit and temporary directory for uploaded files
  (new native.body.multipart({
    maxFilesSize: request.limit,
    autoFields: true,
    autoFiles: true,
    uploadDir: platform.io.resolve('/tmp/')
  })).parse(request, function (err, fields, files) {
    if (err) {
      callback(err);
      return;
    }
    //C: creating result object
    var result = {};
    //C: extracting fields from content data
    Object.keys(fields).forEach(function(name) {
      result[name] = fields[name];
    });
    //C: extracting files from content data
    Object.keys(files).forEach(function(name) {
      //C: replacing each file info with read stream for each file
      files[name].forEach(function(file,index,collection){
        collection[index] = platform.io.system.get.stream(file.path);
        collection[index].fieldName = file.fieldName;
        collection[index].originalFilename = file.originalFilename;
        collection[index].path = file.path;
        collection[index].headers = file.headers;
        collection[index].size = file.size;
      });
      //C: extending fields with files preserving data through arrays (consistent with multiparty internals)
      if (result.hasOwnProperty(name) === true) {
        result[name] = result[name].concat(files[name]);
      } else {
        result[name] = files[name];
      }
    });
    //C: flattening single item arrays
    Object.keys(result).forEach(function(name) {
      if (result[name].length === 1) {
        result[name] = result[name][0];
      }
    });
    callback(null,result);
  });
});
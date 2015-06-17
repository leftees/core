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

//TODO: migrate to contextify or similar for isolation?
// creating and enforcing global context namespace (using node domains for isolation)
Object.defineProperty(global,'context',{
  get: function(){
    // returning context object from active domain
    if (native.domain.active != null && native.domain.active._context != null) {
      return native.domain.active._context;
    } else {
      return null;
    }
  },
  set: function(){},
  configurable: false
});

/**
 * Provides server-side specific classes and namespaces.
 * @namespace
*/
platform.server = platform.server || {};

/**
 * Provides HTTP web server management objects and methods.
 * @namespace
*/
platform.server.http = platform.server.http || {};

/**
 * Provides HTTP context classes.
 * @namespace
*/
platform.server.http.context = platform.server.http.context || {};

/**
 * Create a context object for HTTP request processing.
 * @param {} request Specifies the current request object.
 * @param {} response Specifies the response object for current request.
 * @param {} server Specifies the server object for current request.
 * @param {} callback<err,context> Specifies the callback to be invoked when object is ready or error occurred.
 * @return {} Returns a context object.
*/
platform.server.http.context.create = function(request, response, server){
  // creating result object
  var result = {};

  // appending context objects
  result.request = request;
  result.response = response;
  result.server = server;
  result.session = null;
  result.identity = null;

  // creating call object
  result.call = new CallObject(request,response,server);
  native.object.fast(result);

  return result;
};

var CallObject = function(request,response,server){
  this.request = request;
  this.response = response;
  this.server = server;
};

CallObject.prototype = {
  // defining url object (parsed)
  get url(){
    if (this._url == null) {
      var request = this.request;
      var server = this.server;
      var url = native.url.parse(this.request.url,true);
      // extending url object with host from HTTP headers
      url.host = request.headers['host'];
      // extending url object with hostname extracted from HTTP headers
      if (typeof url.host === 'string' && url.host.indexOf(':') === -1) {
        url.hostname = request.headers['host'];
      } else {
        url.hostname = request.headers['host'].substr(0,url.host.indexOf(':'));
      }
      // extending url object with server port
      url.port = server.port;
      // extending url object with server protocol
      url.protocol = (server.secure === true) ? 'https:' : 'http:';
      // extending url object with uri (full uri without querystring)
      url.uri = url.protocol + '//' + url.host + url.pathname;
      // extending url object with origin extracted from HTTP headers
      url.origin = request.headers['origin'];
      // extending url object with referer extracted from HTTP headers
      url.referer = request.headers['referer'];
      // extracting origin from referer if missing
      if ((url.origin == null) && typeof url.referer === 'string') {
        url.origin = url.referer.replace(/http[s]{0,1}:\/\//,'').replace(/\/.*$/,'');
      }
      this._url = url;
    }
    return this._url;
  },
  // extending call object with HTTP method
  get method(){
    return this.request.method;
  },
  // extending call object with type extracted from ContentType header
  get type(){
    var type = this.request.headers['content-type'];
    // cleaning from charset data (substr untill ';')
    if (typeof type === 'string' && type.indexOf(';') !== -1) {
      type = type.substr(0,type.indexOf(';'));
    }
    return type;
  },
  // extending call with arguments (querystring params)
  get arguments(){
    if (this._arguments == null){
      this._arguments = native.util._extend({},native.url.parse(this.request.url,true).query) || {};
      this._arguments = JSON.normalize(this._arguments,true);
    }
    return this._arguments;
  },
  // creating object container for request body helper
  get data(){
    if (this._data == null){
      this._data = new DataObject(this,this.request,this.response,this.server);
    }
    return this._data;
  }
};

var DataObject = function(call,request,response,server){
  this.call = call;
  this.request = request;
  this.response = response;
  this.server = server;
  if (parseInt(request.headers['content-length'] || 0) === 0){
    this._ready = true;
  } else {
    this._ready = false;
  }
};

DataObject.prototype = {
  // getting request body length from HTTP headers
  get length(){
    return this.request.headers['content-length'] || 0;
  },
  // defining content object representation (assigned later)
  get object(){
    return this._object;
  },
  // defining flag for content data ready (fetched and parsed)
  get ready(){
    return this._ready;
  },
  // defining function to fetch and parse content data
  fetch: function(callback){
    var call = this.call;
    var request = this.request;
    var server = this.server;

    callback = native.util.makeHybridCallbackPromise(callback);

    // skipping if data already fetched
    if (this._ready === true){
      if (server.debug === true && platform.configuration.debug.http === true) {
        console.warn('data already parsed for client request http' + ((server.secure) ? 's' : '') + ':%s#%s', server.port, request.id);
      }
      callback(null);
      return;
    }
    // generating request body if type is supported
    if (platform.server.http.context.parsers.exists(call.type) === true) {
      if (server.debug === true && platform.configuration.debug.http === true) {
        console.debug('parsing data for client request http' + ((server.secure) ? 's' : '') + ':%s#%s', server.port, request.id);
      }
      // getting body parser by content type and executing
      platform.server.http.context.parsers.get(call.type)(request,(function(err,data){
        // returning error if any
        if (err) {
          callback(err);
          return;
        }
        // performing more data handling by type
        //TODO: move into parser specific code?
        switch(call.type) {
          case 'application/x-www-form-urlencoded':
          case 'application/json':
          case 'multipart/form-data':
            // extending call arguments object with content data
            var _query = call._arguments;
            call._arguments = {};
            Object.keys(data).forEach(function(name){
              call._arguments[name] = data[name];
            });
            Object.keys(_query).forEach(function(name){
              call._arguments[name] = _query[name];
            });
            // assigning object representation of object
            this._object = data;
            break;
          default:
            // assigning object representation of object
            this._object = data;
            break;
        }
        call._arguments = JSON.normalize(call._arguments,true);
        this._ready = true;
        callback(null);
      }).bind(this));
    } else {
      call._arguments = JSON.normalize(call._arguments,true);
      // getting data as buffer
      var buffer = [];
      var buffer_length = 0;
      //TODO: apply body size limit
      //TODO: handle errors
      // handling data stream event
      request.on('data', (function (chunk) {
        buffer_length += chunk.length;
        buffer.push(chunk);
        // checking if data read from socket stream is larger than expected
        if (buffer_length > call.data.length && call.data.ready === false) {
          this._object = Buffer.concat(buffer).slice(0, call.data.length);
          this._ready = true;
          callback(null);
        }
      }).bind(this));
      // handling end stream event
      request.on('end', (function () {
        if (this._ready === false) {
          this._object = Buffer.concat(buffer);
          this._ready = true;
          callback(null);
        }
      }).bind(this));
    }

    return callback.promise;
  }
};

/**
 * Provides body parser classes and namespace.
 * @namespace
*/
platform.server.http.context.parsers = platform.server.http.context.parsers || {};

/**
 *  Stores parser objects and instances.
*/
platform.server.http.context.parsers._store = platform.server.http.context.parsers._store || {};

/**
 * Registers a new body parser.
 * @param {} type Specifies the content type of the parser.
 * @param {} parseFunction<request,callback> Specifies the parser as function.
 * @return {} Returns true if the parser is successfully registered.
*/
platform.server.http.context.parsers.register = function(type,parseFunction){
  if (platform.server.http.context.parsers.exists(type) === false) {
    platform.server.http.context.parsers._store[type] = parseFunction;
    return true;
  } else {
    throw new Exception('type %s already exists',type);
  }
};

/**
 * Unregisters a body parser for a content type.
 * @param {} type Specifies the content type of the parser to be unregistered.
 * @return {} Returns true if the backend has been unregistered.
*/
platform.server.http.context.parsers.unregister = function(type){
  if (platform.server.http.context.parsers.exists(type) === true) {
    return delete platform.server.http.context.parsers._store[type];
  } else {
    throw new Exception('type %s does not exist',type);
  }
};

/**
 * Lists the content types registered.
 * @return {} Returns an array of types registered.
*/
platform.server.http.context.parsers.list = function(){
  return Object.keys(platform.server.http.context.parsers._store);
};

/**
 * Gets a body parser by content type.
 * @param {} type Specifies the content type of the parser to be returned.
 * @return {} Returns the body parser function.
*/
platform.server.http.context.parsers.get = function(type){
  if (platform.server.http.context.parsers.exists(type) === true) {
    return platform.server.http.context.parsers._store[type];
  } else {
    throw new Exception('parser for %s not found',type);
  }
};

/**
 * Checks whether the parser is registered for a content type.
 * @param {} type Specifies the content type of the parser to be checked.
 * @return {} Returns true if the body parser exists.
*/
platform.server.http.context.parsers.exists = function(type){
  return (platform.server.http.context.parsers._store.hasOwnProperty(type) && typeof platform.server.http.context.parsers._store[type] === 'function');
};




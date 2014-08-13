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

platform.server.http.context = {};

platform.server.http.context.create = function(request, response, server, session, identity, callback){
  var result = {};
  result.request = request;
  result.response = response;
  result.server = server;
  result.session = session;
  result.identity = identity;
  var call = result.call = {};
  call.url = native.url.parse(request.url,true);
  call.url.host = request.headers['host'];
  if (typeof call.url.host === 'string' && call.url.host.indexOf(':') === -1) {
    call.url.hostname = request.headers['host'];
  } else {
    call.url.hostname = request.headers['host'].substr(0,call.url.host.indexOf(':'));
  }
  call.url.port = server.port;
  call.url.protocol = (server.secure === true) ? 'https:' : 'http:';
  call.url.uri = call.url.protocol + '//' + call.url.host + call.url.pathname;
  call.url.origin = request.headers['origin'];
  call.url.referer = request.headers['referer'];
  if ((call.url.origin === undefined || call.url.origin === null) && typeof call.url.referer === 'string') {
    call.url.origin = call.url.referer.replace(/http[s]{0,1}:\/\//,'').replace(/\/.*$/,'');
  }
  call.method = request.method;
  call.invoke = call.url.pathname.substr(1).replace(/\//g,'.');
  call.data = {};
  call.type = request.headers['content-type'];
  if (typeof call.type === 'string' && call.type.indexOf(';') !== -1) {
    call.type = call.type.substr(0,call.type.indexOf(';'));
  }
  call.arguments = call.url.query;
  call.data.length = request.headers['content-length'] || 0;
  call.data.object = null;
  if (call.data.length > 0 && platform.server.http.context.bodyTypes.exist(call.type) === true) {
    platform.server.http.context.bodyTypes.get(call.type)(request,function(err,data){
      if (err) {
        callback(err);
        return;
      }
      switch(call.type) {
        case 'application/x-www-form-urlencoded':
        case 'application/json':
        case 'multipart/form-data':
          call.arguments = {};
          Object.keys(data).forEach(function(name){
            call.arguments[name] = data[name];
          });
          Object.keys(call.url.query).forEach(function(name){
            call.arguments[name] = call.url.query[name];
          });
          call.data.object = data;
          break;
        default:
          call.data.object = data;
      }
      callback(null, result);
    });
  } else {
    callback(null, result);
  }
};

Object.defineProperty(global,'context',{
  get: function(){
    if (native.domain.active != null && native.domain.active.__context__ != null) {
      return native.domain.active.__context__;
    } else {
      return null;
    }
  },
  set: function(){},
  configurable: false
});

platform.server.http.context.bodyTypes = {};

platform.server.http.context.bodyTypes.__store__ = {};

platform.server.http.context.bodyTypes.list = function(){
  return Object.keys(platform.server.http.context.bodyTypes.__store__);
};

platform.server.http.context.bodyTypes.register = function(type,parseFunction){
  if (platform.server.http.context.bodyTypes.exist(type) === false) {
    platform.server.http.context.bodyTypes.__store__[type] = parseFunction;
    return true;
  } else {
    throw new Exception('type \'%s\' already exists',type);
  }
};

platform.server.http.context.bodyTypes.unregister = function(type){
  if (platform.server.http.context.bodyTypes.exist(type) === true) {
    return delete platform.server.http.context.bodyTypes.__store__[type];
  } else {
    throw new Exception('type \'%s\' does not exist',type);
  }
};


platform.server.http.context.bodyTypes.get = function(type){
  if (platform.server.http.context.bodyTypes.exist(type) === true) {
    return platform.server.http.context.bodyTypes.__store__[type];
  } else {
    throw new Exception('parser for \'%s\' not found',type);
  }
};

platform.classes.list = function(){
  return Object.keys(platform.server.http.context.bodyTypes.__store__);
};

platform.server.http.context.bodyTypes.exist = function(type){
  return (platform.server.http.context.bodyTypes.__store__.hasOwnProperty(type) && typeof platform.server.http.context.bodyTypes.__store__[type] === 'function');
};

platform.server.http.context.bodyTypes.register('text/plain',function(request,callback){
  native.body.text(request,null,{
    limit: request.limit
  },callback);
});
platform.server.http.context.bodyTypes.register('application/x-www-form-urlencoded',function(request,callback){
  native.body.form(request,null,{
    limit: request.limit
  },callback);
});
platform.server.http.context.bodyTypes.register('application/json',function(request,callback){
  native.body.json(request,null,{
    limit: request.limit
  },callback);
});
platform.server.http.context.bodyTypes.register('text/html',function(request,callback){
  native.body.text(request,null,{
    limit: request.limit
  },function(err,data){
    if (err) {
      callback(err);
      return;
    }
    try{
      callback(null,native.dom.html(data));
    } catch(err) {
      callback(err,data);
    }
  });
});
platform.server.http.context.bodyTypes.register('text/xml',function(request,callback){
  native.body.text(request,null,{
    limit: request.limit
  },function(err,data){
    if (err) {
      callback(err);
      return;
    }
    try {
      callback(null,native.dom.xml(data));
    }catch(err){
      callback(err,data);
    }
  });
});
platform.server.http.context.bodyTypes.register('multipart/form-data',function(request,callback) {
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
    var result = {};
    Object.keys(fields).forEach(function(name) {
      result[name] = fields[name];
    });
    Object.keys(files).forEach(function(name) {
      files[name].forEach(function(file,index,collection){
        collection[index] = platform.io.system.get.stream(file.path);
        collection[index].fieldName = file.fieldName;
        collection[index].originalFilename = file.originalFilename;
        collection[index].path = file.path;
        collection[index].headers = file.headers;
        collection[index].size = file.size;
      });
      if (result.hasOwnProperty(name) === true) {
        result[name] = result[name].concat(files[name]);
      } else {
        result[name] = files[name];
      }
    });
    Object.keys(result).forEach(function(name) {
      if (result[name].length === 1) {
        result[name] = result[name][0];
      }
    });
    callback(null,result);
  });
});
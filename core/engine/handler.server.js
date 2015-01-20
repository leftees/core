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

platform.engine.handlers = platform.engine.handlers || {};

platform.engine.handlers._store = {};

platform.engine.handlers.register = function(name,options){
  if (platform.engine.handlers.exist(name) === false) {
    var handler = options;

    if (handler.daemon != null && handler.daemon.exec != null){
      if (handler.daemon.root != null && handler.daemon.root.startsWith(native.path.sep) === false){
        handler.daemon.root = platform.io.map(handler.daemon.root);
      }
      handler._process = require('child_process').spawn('bash', ['-c',handler.daemon.exec||''],{ 'cwd': handler.daemon.root });

      //C: attaching child stdout to process stdoud
      handler._process.stdout.pipe(process.stdout);
      //handler._process.stdout.on('data',function(data){
      //  process.stdout.write(data);
      //});

      //C: attaching child stderr to process stderr
      handler._process.stderr.pipe(process.stderr);
      //handler._process.stderr.on('data',function(data){
      //  process.stderr.write(data);
      //});

      //C: attaching on child close event to exit main
      handler._process.on('close', function (code,signal) {
        handler._process = undefined;
      });

      //C: attaching on main process kill events to kill handler before exit
      ['exit'].forEach(function(e) {
        process.on(e, function() {
          platform.engine.handlers.unregister(name);
        });
      });
    }

    switch(handler.type){
      case 'fastcgi':
        handler._client = platform.kernel.new('core.net.fastcgi.client',[handler.port||handler.socket,((handler.socket == null) ? (handler.host||'localhost') : null)]);
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

    if (handler._process != null){
      handler._process.kill();
      handler._process = undefined;
    }

    switch(handler.type){
      case 'fastcgi':
        //T: close fcgi client when pool will be implemented
        handler._client = null;
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
          if (handler.filter.test(cleaned_url) === true && (handler.filter.lastIndex = 0) === 0) {
            return name;
          }
        }
      }
    }
  }
};

platform.engine.handlers.data = {};

platform.engine.handlers.data.get = function(name, key){
  if (key == null) {
    if (context.session != null && context.session.handlers[name] != null) {
      return context.session.handlers[name];
    }
  } else {
    if (context.session != null && context.session.handlers[name] != null) {
      return context.session.handlers[name][key];
    }
  }
  return null;
};

platform.engine.handlers.data.set = function(name, key, value){
  if (context.session != null) {
    if (context.session.handlers[name] == null) {
      context.session.handlers[name] = {};
    }
    context.session.handlers[name][key] = value;
    if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
      console.debug('keeping header %s for handler %s in session %s (manual)',key,name,context.session.name);
    }
  }
};

platform.engine.handlers.data._merge = function(name, handler, headers){
  var result = {};
  Object.keys(headers).forEach(function(key){
    if(key === 'host' || (handler.headers != null && handler.headers.mask != null && handler.headers.mask.out != null && handler.headers.mask.out.constructor === Array && handler.headers.mask.out.indexOf(key) > -1)){
    } else {
      result[key] = headers[key];
    }
  });
  if (context.session != null && context.session.handlers[name] != null) {
    Object.keys(context.session.handlers[name]).forEach(function (key) {
      if (key === 'cookie'){
        var cookie_store = {};
        context.session.handlers[name][key].forEach(function(cookie_object){
          //T: add support for expire/maxAge
          var cookie_name = Object.keys(cookie_object)[0];
          cookie_store[cookie_name] = cookie_object[cookie_name];
        });
        result['cookie'] = native.cookie.serialize(cookie_store);
        if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
          console.debug('merging cookie %s for handler %s from session %s',cookie_name,name,context.session.name);
        }
      } else if (handler.headers != null && handler.headers.keep != null && handler.headers.keep.constructor === Array && handler.headers.keep.indexOf(key) > -1) {
        if (context.session.handlers[name] != null && context.session.handlers[name][key] != null) {
          result[key] = context.session.handlers[name][key];
          //T: support multiple header values (a.k.a. arrays)
          if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
            console.debug('merging header %s for handler %s from session %s',key,name,context.session.name);
          }
        }
      }
    });
  }
  return result;
};

platform.engine.handlers.data._keep = function(name, handler, headers){
  if (context.session != null) {
    Object.keys(headers).forEach(function (key) {
      if (key === 'set-cookie'){
        if (typeof headers[key] === 'string'){
          headers[key] = [headers[key]];
        }
        headers[key].forEach(function(cookie_string){
          if (context.session.handlers[name] == null) {
            context.session.handlers[name] = {};
          }
          if (context.session.handlers['cookie'] == null) {
            context.session.handlers['cookie'] = {};
          }
          var cookie_data = native.cookie.parse(cookie_string);
          var cookie_name = Object.keys(cookie_data)[0];
          context.session.handlers[name]['cookie'][cookie_name] = cookie_data;
          if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
            console.debug('keeping cookie %s for handler %s in session %s',cookie_name,name,context.session.name);
          }
        });
      } else if (handler.headers != null && handler.headers.keep != null && handler.headers.keep.constructor === Array && handler.headers.keep.indexOf(key) > -1) {
        if (context.session.handlers[name] == null) {
          context.session.handlers[name] = {};
        }
        //T: support multiple header values (a.k.a. arrays)
        context.session.handlers[name][key] = headers[key];
        if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
          console.debug('keeping header %s for handler %s in session %s',key,name,context.session.name);
        }
      }
    });
  }
};

platform.engine.handlers.data._mask = function(name, handler, headers){
  var result = {};
  Object.keys(headers).forEach(function(key){
    if(handler.headers != null && handler.headers.mask != null && handler.headers.mask.in != null && handler.headers.mask.in.constructor === Array && handler.headers.mask.in.indexOf(key) > -1){
      if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
        console.debug('masking header %s for handler %s',key,name);
      }
    } else {
      result[key] = headers[key];
    }
  });
  return result;
};

platform.engine.handlers.data.clean = function(name){
  if (context.session != null) {
    delete context.session.handlers[name];
  }
};

platform.engine.handlers.process = function(name){
  if (platform.engine.handlers.exist(name) === true) {
    var request = context.request;
    var response = context.response;
    var call = context.call;

    var handler = platform.engine.handlers._store[name];
    if (context.server.debug === true && platform.configuration.server.debugging.http === true) {
      console.debug('forwarding client request http' + ((context.server.secure) ? 's' : '') + ':%s#%s to %s handler %s', context.server.port, request.id, handler.type,name);
    }

    switch(handler.type){
      case 'fastcgi':
      case 'http':
        response._async = true;
        //T: use native.url.parse/native.url.format?
        var remote_url = request.url;
        if (handler.to != null) {
          var query_marker = remote_url.indexOf('?');
          if (query_marker > -1) {
            remote_url = remote_url.substr(0, query_marker);
          }
          if (handler.filter.constructor !== RegExp) {
            remote_url = native.url.resolve(handler.to, remote_url);
          } else {
            remote_url = remote_url.replace(handler.filter, handler.to);
          }
          if (query_marker > -1) {
            remote_url += request.url.substr(query_marker);
          }
        }
        var remote_url_object = native.url.parse(remote_url);
        if (typeof handler.strip === 'number' && handler.strip > 0) {
          remote_url_object.path = remote_url_object.path.split('/');
          remote_url_object.path.splice(1,handler.strip);
          remote_url_object.path = remote_url_object.path.join('/');
        }

        var options = {};
        options.method = request.method;
        options.host = remote_url_object.host;
        options.port = remote_url_object.port;
        options.path = remote_url_object.path;
        options.headers = platform.engine.handlers.data._merge(name, handler,request.headers);
        var remote_request = null;
        if (handler.type === 'fastcgi'){
          remote_request = handler._client.request(options);
        } else if (handler.type === 'http'){
          remote_request = native[(remote_url_object.protocol||'http:').replace(':','')].request(options);
        }
        remote_request.on('error',function(err){
          if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
            console.error('exception caught in handler %s for client request #%s: %s',name,request.id,err.stack||err.message);
          }
        });
        remote_request.on('response',function(remote_response){
          if (handler.debug === true && platform.configuration.server.debugging.handler === true) {
            console.debug('forwarding response from %s handler %s to client request #%s with status %s',handler.type,name,request.id,remote_response.statusCode);
          }
          platform.engine.handlers.data._keep(name,handler,remote_response.headers);
          response.statusCode = remote_response.statusCode;
          var masked_headers = platform.engine.handlers.data._mask(name,handler,remote_response.headers);
          Object.keys(masked_headers).forEach(function(key){
            response.setHeader(key,masked_headers[key]);
          });
          remote_response.pipe(response);
          //remote_response.on('data',function(chunk){
          //  response.write(chunk);
          //});
          //remote_response.on('end',function(){
          //  response.end();
          //});
        });
        request.pipe(remote_request);
        //request.on('data',function(chunk){
        //  remote_request.write(chunk);
        //});
        //request.on('end',function(){
        //  remote_request.end();
        //});
        break;
      case 'invoke':
        var invoke = null;
        if (typeof handler.invoke === 'function'){
          invoke = handler.invoke;
        } else if (typeof handler.invoke === 'string'){
          invoke = platform.kernel.get(handler.invoke);
          if (typeof invoke !== 'function') {
            invoke = null;
          }
        }
        if (invoke != null){
          invoke();
        }
        break;
      default:
        throw new Exception('unsupport handler type %s for %s',handler.type,name);
        break;
    }

  } else {
    throw new Exception('handler %s does not exist',name);
  }
};

platform.engine.handlers._init = function(){
  Object.keys(platform.configuration.engine.handlers).forEach(function(name){
    var options = platform.configuration.engine.handlers[name];
    platform.engine.handlers.register(name,options);
  });
};

//T: move init and HTTP(S) start in PXE events
platform.engine.handlers._init();
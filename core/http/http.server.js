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
platform.server = platform.server || {};

/**
 * Provides HTTP web server management objects and methods.
 * @namespace
*/
platform.server.http = platform.server.http || {};

/**
 *  Stores all the native HTTP(S) agent instances.
*/
platform.server.http._agents = platform.server.http._agents || {};

platform.server.http._contexts = platform.server.http._contexts || [];

platform.server.http.collect = function(){
  // calculating time and executing domain cleanup collector
  var domains_length = platform.server.http._contexts.length;
  var time_start = Date.now();
  platform.server.http._contexts.forEach(function(domain){
    domain.exit();
  });
  platform.server.http._contexts = [];
  var time_stop = Date.now();
  // logging
  if (platform.configuration.debug.http === true) {
    console.debug('http context cache collected in %s (%s domains disposed)',Number.toHumanTime(time_stop-time_start),domains_length);
  }
  // cleaning memory
  platform.system.memory.collect();
};

/**
 * Starts application server HTTP(S) listeners.
 * @param {} [port] Specifies the port to be started. If missing, all configured ports will be started.
 * @return {} None.
*/
platform.server.http.start = function(port){
  //TODO: support unix socket too
  if (port != null){
    if (platform.server.http._agents.hasOwnProperty(port) === true) {
      platform.server.http._agents[port].http.listen(parseInt(port));
    } else {
      throw new Exception('no configuration available for port %s', port);
    }
  } else {
    Object.keys(platform.server.http._agents).forEach(function (port) {
      platform.server.http._agents[port].http.listen(parseInt(port));
    });
  }
};

/**
 * Stops application server HTTP(S) listeners.
 * @param {} [port] Specifies the port to be stopped. If missing, all configured ports will be stopped.
 * @return {} None.
*/
platform.server.http.stop = function(port){
  //TODO: support unix socket too
  if (port != null){
    if (platform.server.http._agents.hasOwnProperty(port) === true) {
      platform.server.http._agents[port].http.close();
    } else {
      throw new Exception('no configuration available for port %s', port);
    }
  } else {
    Object.keys(platform.server.http._agents).forEach(function (port) {
      platform.server.http._agents[port].http.close();
    });
  }
};

/**
 * Initializes HTTP(S) listeners.
*/
platform.server.http._init = function() {
  // creating native HTTP listener for each configured port
  Object.keys(platform.configuration.server.http.ports).forEach(function (port_list) {
    // getting port configuration
    var config = platform.configuration.server.http.ports[port_list];
    // splitting multiple ports (separated by '|')
    var ports = port_list.split('|');
    ports.forEach(function (port) {
      var agent_http, agent_websocket, options;
      // detecting whether the listener should be an HTTPS one
      if (config.secure === true) {
        options = {};
        // using localhost self-signed certificate if missing
        if (config.pfx == null && config.cert == null) {
          options.pfx = null;
          options.passphrase = null;
          options.cert = native.fs.readFileSync(platform.configuration.runtime.path.core + '/core/ssl/self.crt');
          options.key = native.fs.readFileSync(platform.configuration.runtime.path.core + '/core/ssl/self.key');
        } else {
          // loading certificates from files if any
          if (config.pfx != null) {
            options.pfx = platform.io.get.bytesSync(config.pfx);
          }
          if (config.cert != null) {
            options.cert = platform.io.get.bytesSync(config.cert);
          }
          if (config.key != null) {
            options.key = platform.io.get.bytesSync(config.key);
          }
        }
        // defining default ciphers if missing
        options.ciphers = config.ciphers || 'HIGH !aNULL !eNULL !MEDIUM !LOW !3DES !MD5 !EXP !PSK !SRP !DSS';
        // defining default supported protocols if missing
        var protocols = config.protocols || {
          'SSLv3': false,
          'TLSv10': true,
          'TLSv11': true,
          'TLSv12': true
        };
        // masking the protocol version to be supported
        var SSL_OP_NO = {
          'SSLv2': 0x01000000,
          'SSLv3': 0x02000000,
          'TLSv10': 0x04000000,
          'TLSv11': 0x10000000,
          'TLSv12': 0x08000000
        };
        options.secureOptions = SSL_OP_NO['SSLv2'];
        Object.keys(protocols).forEach(function (protocol) {
          if (protocols[protocol] === false) {
            options.secureOptions |= SSL_OP_NO[protocol];
          }
        });
      }

      // getting port-specific debug log configuration
      config.debug = (config.debug == null || config.debug === true);

      // getting protocol scheme
      var protocol = (config.secure === true) ? 'https' : 'http';

      // instancing native HTTP listener
      //TODO: implement http auth internally (dismiss http-auth module)
      if (config.auth === 'basic' || config.auth === 'digest') {
        config.realm = '';
        var checker = native.httpauth[config.auth](
          {
            'realm': config.realm
          },
          platform.engine.process.auth[config.auth].bind(null,config.realm)
        );
        // enabling httpauth module if requested
        agent_http = native[protocol].createServer(checker,options);
      } else {
        agent_http = native[protocol].createServer(options);
      }

      // extending native http listener with config info
      agent_http.secure = config.secure;
      agent_http.debug = config.debug;
      agent_http.limit = config.limit || platform.configuration.server.http.default.limit;
      agent_http.timeout = config.timeout || platform.configuration.server.http.default.timeout;
      //TODO: use object merge to override nested configurations
      agent_http.compression = config.compression || platform.configuration.server.http.default.compression;
      agent_http.auth = config.auth;
      agent_http.realm = config.realm;
      agent_http.port = port;
      agent_http.redirect = config.redirect||{};
      agent_http.reject = config.reject||{};

      // extending native http listener with request counter
      agent_http.count = 0;

      // instancing antive WebSocket server
      agent_websocket = new native.websocket.server({ noServer: true });

      // attaching to new request event
      agent_http.on('request',platform.server.http.events.server.request);

      // attaching to native HTTP listener upgrade event
      agent_http.on('upgrade', platform.server.http.events.server.upgrade);

      // attaching to native HTTP listener connection/clientError/close events for debug log
      if (agent_http.debug === true && platform.configuration.debug.http === true) {
        agent_http.on('connection', platform.server.http.events.server.connection);
        agent_http.on('clientError', platform.server.http.events.server.error);
        agent_http.on('close', platform.server.http.events.server.close);
      }

      // storing native HTTP listener instance
      platform.server.http._agents[port] = {};
      platform.server.http._agents[port].http = agent_http;
      platform.server.http._agents[port].websocket = agent_websocket;
    });
  });
};

native.http.ServerResponse.prototype._end = native.http.ServerResponse.prototype.end;
native.http.ServerResponse.prototype._ended = false;
native.http.ServerResponse.prototype.end = function(data, encoding){
  if (this._ended === false) {
    this._ended = true;
    this._end.apply(this, [data, encoding]);
  }
};
native.http.ServerResponse.prototype.isEnded = function(){
  return this._ended;
};
native.http.IncomingMessage.prototype.redirect = function (redirect_to) {
  var server = this.server;
  var secure = server.secure;
  var port = server.port;
  var debug = server.debug;
  var count = this.id;
  var request = this;
  var response = request.response;
  // updating stats
  platform.statistics.get('http.request.redirect').inc();
  if (debug === true && platform.configuration.debug.http === true) {
    console.warn('redirected request http' + ((secure) ? 's' : '') + ':%s#%s for %s to %s', port, count, request.url, redirect_to);
  }
  response.statusCode = '302';
  response.setHeader('Location', redirect_to);
  response.end();
};

platform.server.http.events = {};

platform.server.http.events.server = {};

platform.server.http.events.server.request = function (request, response) {
  // skipping requests waiting for http-auth
  if (response.statusCode === 401) {
    return;
  }

  // storing the request receive time
  request.start =  Date.now();

  // getting needed listener configurations
  var secure = this.secure;
  var port = this.port;
  var debug = this.debug;
  var reject = this.reject;
  var server = this;

  request.server = server;
  response.server = server;

  // extending request object with needed properties from listener
  request.limit = this.limit;
  request.timeout = this.timeout;
  request.setTimeout(this.timeout,function(){
    //request.abort();
  });

  // creating request.client property (with address and port) to simulate common behavior
  request.client = response.client = {};
  var remote_address = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
  var remote_port = request.client.port = request.socket.remotePort || request.socket._peername.port;

  request.response = response;
  response.request = request;

  // incrementing request count for listener and using it as request.id property
  if (this.count === Number.MAX_VALUE) {
    this.count = 0;
    if (debug === true && platform.configuration.debug.http === true) {
      console.debug('resetting request id counter because of max value reached in listener http' + ((secure) ? 's' : '') + ':%s', port);
    }
  }
  var count = request.id = response.id = ++this.count;

  // updating stats
  platform.statistics.get('http.request.total').inc();
  platform.statistics.get('http.request.active').inc();
  platform.statistics.get('http.request.rate').mark();

  // logging
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('new request http' + ((secure) ? 's' : '') + ':%s#%s from %s:%s', port, count, remote_address, remote_port);
  }

  //TODO: use native.url.parse/native.url.format?
  // getting url cleaned by querystring
  var cleaned_url = request.url;
  var query_marker = cleaned_url.indexOf('?');
  if (query_marker > -1) {
    cleaned_url = cleaned_url.substr(0, query_marker);
  }

  // checking if request should be redirected (port-specific)
  var redirect_to = null;
  redirect_to = platform.server.http._check_redirect(cleaned_url,this.redirect);
  if (redirect_to == null){
    // checking if request should be redirected (default)
    redirect_to = platform.server.http._check_redirect(cleaned_url,platform.configuration.server.http.default.redirect);
  }
  if (redirect_to != null) {
    // preserving querystring parameters
    if (query_marker > -1) {
      redirect_to += request.url.substr(query_marker);
    }
    // redirecting and exiting
    request.redirect(redirect_to);
    return;
  }

  // validating URL
  if ((reject.url||platform.configuration.server.http.default.reject.url).test(cleaned_url) === true && ((reject.url||platform.configuration.server.http.default.reject.url).lastIndex = 0) === 0) {
    // updating stats
    platform.statistics.get('http.request.reject').inc();
    // logging reject if debug enabled
    if (debug === true && platform.configuration.debug.http === true) {
      console.warn('rejected client request http' + ((secure) ? 's' : '') + ':%s#%s with url %s not allowed', port, count, request.url);
    }
    // returning 404 status code (for security reason we do not reply with 403/406)
    response.statusCode = 404;
    //TODO: return json, html or text depending on acceptable content type
    if (request.method === 'HEAD') {
      response.end();
    } else {
      response.end("404 File not found");
    }
    return;
  }

  // logging new context if debug enabled
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('creating context request http' + ((secure) ? 's' : '') + ':%s#%s', port, count);
  }

  // creating request-specific domain (required for call context)
  //TODO: migrate to contextify or similar for isolation?
  var domain = null;
  if (platform.server.http._contexts.length > 0) {
    domain = platform.server.http._contexts.pop();
  } else {
    domain = native.domain.create();
  }

  request.domain = domain;
  response.domain = domain;

  domain.on('error', platform.server.http.events.domain.error.bind(domain,request,response,server));

  // attaching to domain events error/dispose if debug is enabled
  domain.on('dispose', platform.server.http.events.domain.dispose.bind(domain,request,response,server));

  // attaching to response finish event (request processing ended)
  response.on('finish', platform.server.http.events.response.finish);

  // attaching to request close event
  request.on('close', platform.server.http.events.request.close);

  // logging request processing if debug enabled
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('processing client request http' + ((secure) ? 's' : '') + ':%s#%s for %s', port, count, request.url);
  }

  // processing request within domain
  domain.run(function(){
    // creating http call context and storing through pseudo-thread-static context object
    //TODO: should be disposed somewhere? (maybe domain.dispose is sufficient)
    native.domain.active._context = platform.server.http.context.create(request, response, server);
    // processing request
    //TODO: complete port of multihost support from 0.3.x branch
    platform.engine.process.http().then(function(){
      if (response.isEnded() === false){
        response.setHeader('Content-Type','text/plain');
        // returning 404 status code (for security reason we do not reply with 403/406)
        response.statusCode = 404;
        //TODO: return json, html or text depending on acceptable content type
        response.end("404 File not found");
      }
    }).catch(function(error){
      platform.statistics.get('http.request.error').inc();
      if(platform.configuration.debug.http === true) {
        console.error('uncaught exception in request http' + ((secure) ? 's' : '') + ':%s#%s: %s', port, count, error.stack || error.message);
        if (platform.configuration.debug.exception === true) {
          console.dir(error);
        }
      }
      //TODO: return json, html or text depending on acceptable content type
      response.setHeader('Content-Type','application/json');
      response.statusCode = 500;

      var content = null;
      if (platform.configuration.runtime.debugging === true || platform.configuration.runtime.development === true){
        content = JSON.stringify({
          'error': error
        });
      } else {
        content = JSON.stringify({
          'error': {
            'message' :error.message
          }
        });
      }
      var content_length = content.length;

      var data_stream = response;
      if (server.compression.enable === true && content_length > server.compression.limit && request.headers['accept-encoding'] != null && request.headers['accept-encoding'].includes('gzip') === true) {
        response.setHeader ('Content-Encoding', 'gzip');
        data_stream = native.zlib.createGzip();
        data_stream.pipe(response);
      }

      if (request.method !== 'HEAD') {
        data_stream.write(content);
      }
      data_stream.end();
    });
  });

};

platform.server.http.events.server.upgrade = function(request, socket, upgradeHead) {
  // getting needed listener configurations
  var server = this;
  var secure = server.secure;
  var port = server.port;
  var debug = server.debug;
  var agent_websocket = platform.server.http._agents[port].websocket;

  // creating request.client property (with address and port) to simulate common behavior
  request.client = response.client = {};
  var remote_address = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
  var remote_port = request.client.port = request.socket.remotePort || request.socket._peername.port;

  // logging connection if debug is enabled
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('upgrading client request %s:%s for listener http' + ((secure) ? 's' : '') + ':%s', remote_address, remote_port, port);
  }

  // handling upgrade protocol
  switch(request.headers['upgrade']) {
    case 'websocket':
      // updating stats
      platform.statistics.get('http.upgrade.websocket').inc();
      // upgrading request to WebSocket
      agent_websocket.handleUpgrade(request, socket, upgradeHead, function (websocket) {
        // logging new websocket if debug is enabled
        if (debug === true && platform.configuration.debug.websocket === true) {
          console.debug('[ws' + ((secure) ? 's' : '') + ':%s] accepting new socket %s:%s', port, remote_address, remote_port);
        }
        // processing new websocket
        //TODO: complete port of multihost support from 0.3.x branch
        platform.engine.process.websocket(request, server, websocket);
      });
      break;
    default:
      // updating stats
      platform.statistics.get('http.upgrade.unimplemented').inc();
      // rejecting unknown protocols
      request.reject(501,'Not implemented');
      break;
  }
};

platform.server.http.events.server.connection = function (socket) {
  // logging connection if debug is enabled
  if (this.debug === true && platform.configuration.debug.http === true) {
    console.debug('accepting new client %s:%s for listener http' + ((this.secure) ? 's' : '') + ':%s', socket.remoteAddress, socket.remotePort, this.port);
  }
};

platform.server.http.events.server.error = function (exception, socket) {
  console.warn('exception client %s:%s for listener http' + ((this.secure) ? 's' : '') + ':%s: %s', socket._peername.address, socket._peername.port, this.port, exception.stack);
};

platform.server.http.events.server.close = function () {
  // logging server shutdown if debug is enabled
  if (this.debug === true && platform.configuration.debug.http === true) {
    console.debug('closed server for port %s', this.port);
  }
};

platform.server.http.events.request = {};

platform.server.http.events.request.close = function () {
  var request = this;
  var server = request.server;
  var secure = server.secure;
  var port = server.port;
  var debug = server.debug;
  var response = request.response;
  var count = request.id;
  var domain = request.domain;

  platform.statistics.get('http.request.active').dec();
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('closed client request http' + ((secure) ? 's' : '') + ':%s#%s', port, count);
  }
  // clearing context data
  if (domain._context != null) {
    delete domain._context['request'];
    delete domain._context['response'];
    delete domain._context['server'];
    delete domain._context['call'];
    domain._context = null;
    if (platform.configuration.server.http.contexts.cache.size > platform.server.http._contexts.length) {
      domain.removeAllListeners();
      platform.server.http._contexts.push(domain);
    } else {
      domain.exit();
    }
  }
};

platform.server.http.events.response = {};

platform.server.http.events.response.finish = function () {
  var response = this;
  var server = response.server;
  var secure = server.secure;
  var port = server.port;
  var debug = server.debug;
  var request = response.request;
  var count = request.id;
  var domain = request.domain;

  platform.statistics.get('http.request.active').dec();
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('finished client request http' + ((secure) ? 's' : '') + ':%s#%s with status %s in %s' + ((domain._context['response']._async === true) ? ' (async)' : ' (sync)'), port, count, domain._context['response'].statusCode, Number.toHumanTime(Date.now()-domain._context['request'].start));
  }
  // clearing context data
  if (domain._context != null) {
    delete domain._context['request'];
    delete domain._context['response'];
    delete domain._context['server'];
    delete domain._context['call'];
    domain._context = null;
    if (platform.configuration.server.http.contexts.cache.size > platform.server.http._contexts.length) {
      domain.removeAllListeners();
      platform.server.http._contexts.push(domain);
    } else {
      domain.exit();
    }
  }
};

platform.server.http.events.domain = {};

platform.server.http.events.domain.error = function (request,response,server,error) {
  var secure = server.secure;
  var port = server.port;
  var debug = server.debug;
  var count = request.id;
  // updating stats
  platform.statistics.get('http.request.error').inc();
  if(platform.configuration.debug.http === true) {
    console.error('uncaught exception in request http' + ((secure) ? 's' : '') + ':%s#%s: %s', port, count, error.stack || error.message);
    if (platform.configuration.debug.exception === true) {
      console.dir(error);
    }
  }
};

platform.server.http.events.domain.dispose = function (request,response,server) {
  var secure = server.secure;
  var port = server.port;
  var debug = server.debug;
  var count = request.id;
  if (debug === true && platform.configuration.debug.http === true) {
    console.debug('disposing context request http' + ((secure) ? 's' : '') + ':%s#%s', port, count);
  }
};

/**
 * Redirect the request if any redirector matches.
*/
platform.server.http._check_redirect = function(url,redirectors){
  // checking if request should be redirected
  for(var redirector in redirectors) {
    if (redirectors.hasOwnProperty(redirector) === true) {
      // getting redirect data
      var redirect_data = redirectors[redirector];
      // applying filter and getting redirection URI
      var redirect_to = null;
      if (redirect_data.filter != null) {
        // checking match against string
        if (typeof redirect_data.filter === 'string') {
          if (url === redirect_data.filter) {
            redirect_to = redirect_data.to;
          }
          // checking match against function
        } else if (typeof redirect_data.filter === 'function') {
          if (redirect_data.filter(url) === true) {
            redirect_to = redirect_data.to;
          }
          // checking match against regexp
        } else if (redirect_data.filter.constructor === RegExp) {
          if (redirect_data.filter.test(url) === true && (redirect_data.filter.lastIndex = 0) === 0) {
            redirect_to = url.replace(redirect_data.filter, redirect_data.to);
          }
        }
        // if match found post-processing redirect
        if (redirect_to != null) {
          switch (typeof redirect_to) {
            case 'function':
              redirect_to = redirect_to(url);
              break;
            case 'string':
              break;
            default:
              redirect_to = null;
              break;
          }
          if (redirect_to != null){
            return redirect_to;
          }
        }
      }
    }
  }
  return null;
};

//? if (CLUSTER) {
platform.cluster.statistics.register('counter','http.request.total',null,true);
platform.cluster.statistics.register('counter','http.request.active',null,true);
platform.cluster.statistics.register('meter','http.request.rate',null,true);
platform.cluster.statistics.register('counter','http.request.redirect',null,true);
platform.cluster.statistics.register('counter','http.request.reject',null,true);
platform.cluster.statistics.register('counter','http.request.error',null,true);
platform.cluster.statistics.register('counter','http.upgrade.websocket',null,true);
platform.cluster.statistics.register('counter','http.upgrade.unimplemented',null,true);
//? } else {
platform.statistics.register('counter','http.request.total',null,true);
platform.statistics.register('counter','http.request.active',null,true);
platform.statistics.register('meter','http.request.rate',null,true);
platform.statistics.register('counter','http.request.redirect',null,true);
platform.statistics.register('counter','http.request.reject',null,true);
platform.statistics.register('counter','http.request.error',null,true);
platform.statistics.register('counter','http.upgrade.websocket',null,true);
platform.statistics.register('counter','http.upgrade.unimplemented',null,true);
//? }

// initializing and starting HTTP(S) listeners
platform.events.attach('application.ready','http.server',function(){
  platform.server.http._init();
  platform.server.http.start();
  if (platform.configuration.server.http.contexts.gc.force === true) {
    // starting forced gc interval if requested by configuration
    platform.server.http._interval = setInterval(platform.server.http.collect, platform.configuration.server.http.contexts.gc.interval);
  }
});
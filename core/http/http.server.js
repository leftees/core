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

//N: Provides server-side specific classes and namespaces.
platform.server = platform.server || {};

//N: Provides HTTP web server management objects and methods.
platform.server.http = platform.server.http || {};

//V: Stores all the native HTTP(S) agent instances.
platform.server.http._agents = platform.server.http._agents || {};

//F: Starts application server HTTP(S) listeners.
//A: [port]: Specifies the port to be started. If missing, all configured ports will be started.
//R: None.
platform.server.http.start = function(port){
  //T: support unix socket too
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

//F: Stops application server HTTP(S) listeners.
//A: [port]: Specifies the port to be stopped. If missing, all configured ports will be stopped.
//R: None.
platform.server.http.stop = function(port){
  //T: support unix socket too
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

//F: Initializes HTTP(S) listeners.
platform.server.http._init = function() {
  //C creating native HTTP listener for each configured port
  Object.keys(platform.configuration.server.http.ports).forEach(function (port_list) {
    //C: getting port configuration
    var config = platform.configuration.server.http.ports[port_list];
    //C: splitting multiple ports (separated by '|')
    var ports = port_list.split('|');
    ports.forEach(function (port) {
      var agent_http, agent_websocket, options;
      //C: detecting whether the listener should be an HTTPS one
      if (config.secure === true) {
        options = {};
        //C: using localhost self-signed certificate if missing
        if (config.pfx == null && config.cert == null) {
          options.pfx = null;
          options.passphrase = null;
          options.cert = native.fs.readFileSync(platform.runtime.path.core + '/core/ssl/self.crt');
          options.key = native.fs.readFileSync(platform.runtime.path.core + '/core/ssl/self.key');
        } else {
          //C: loading certificates from files if any
          if (config.pfx != null) {
            options.pfx = platform.io.get.bytes(config.pfx);
          }
          if (config.cert != null) {
            options.cert = platform.io.get.bytes(config.cert);
          }
          if (config.key != null) {
            options.key = platform.io.get.bytes(config.key);
          }
        }
        //C: defining default ciphers if missing
        options.ciphers = config.ciphers || 'HIGH !aNULL !eNULL !MEDIUM !LOW !3DES !MD5 !EXP !PSK !SRP !DSS';
        //C: defining default supported protocols if missing
        var protocols = config.protocols || {
          'SSLv3': false,
          'TLSv10': true,
          'TLSv11': true,
          'TLSv12': true
        };
        //C: masking the protocol version to be supported
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

      //C: getting port-specific debug log configuration
      config.debug = (config.debug == null || config.debug === true);

      //C: getting protocol scheme
      var protocol = (config.secure === true) ? 'https' : 'http';

      //C: instancing native HTTP listener
      //T: implement http auth internally (dismiss http-auth module)
      if (config.auth === 'basic' || config.auth === 'digest') {
        //C: enabling httpauth module if requested
        agent_http = native[protocol].createServer(native.httpauth[config.auth](
          {
            'realm': config.realm
          },
          platform.engine.process.auth[config.auth].bind(null,config.realm)
        ),options);
      } else {
        agent_http = native[protocol].createServer(options);
      }

      //C: extending native http listener with config info
      agent_http.secure = config.secure;
      agent_http.debug = config.debug;
      agent_http.limit = config.limit || platform.configuration.server.http.default.limit;
      agent_http.timeout = config.timeout || platform.configuration.server.http.default.timeout;
      //T: use object merge to override nested configurations
      agent_http.compression = config.compression || platform.configuration.server.http.default.compression;
      agent_http.auth = config.auth;
      agent_http.realm = config.realm;
      agent_http.port = port;
      agent_http.redirect = config.redirect||{};
      agent_http.reject = config.reject||{};

      //C: extending native http listener with request counter
      agent_http.count = 0;

      //C: attaching to new request event
      agent_http.on('request',function (request, response) {
        request.start =  Date.now();

        //C: getting needed listener configurations
        var secure = this.secure;
        var port = this.port;
        var debug = this.debug;
        var redirect = this.redirect;
        var reject = this.reject;
        var server = this;

        //C: adding response.end awareness stuff
        var response_end = response.end;
        response._ended = false;
        response.isEnded = function(){
          return response._ended;
        };
        response.end = function(data, encoding){
          response._ended = true;
          response_end.apply(response, [data, encoding]);
        };

        //C: extending request object with needed properties from listener
        request.limit = this.limit;
        request.timeout = this.timeout;
        request.setTimeout(this.timeout,function(){
          //request.abort();
        });

        //C: creating request.client property (with address and port) to simulate common behavior
        request.client = {};
        var remote_address = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
        var remote_port = request.client.port = request.socket.remotePort || request.socket._peername.port;

        //C: incrementing request count for listener and using it as request.id property
        if (this.count === Number.MAX_VALUE) {
          this.count = 0;
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('resetting request id counter because max value reached in listener http' + ((secure) ? 's' : '') + ':%s', port);
          }
        }
        var count = request.id = ++this.count;

        //C: updating stats
        platform.statistics.counter('http.requests.total').inc();
        platform.statistics.meter('http.requests.active').mark();
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('new request http' + ((secure) ? 's' : '') + ':%s#%s from %s:%s', port, count, remote_address, remote_port);
        }

        //C: extending request object with HTTP redirect function
        request.redirect = function (redirect_to) {
          //C: updating stats
          platform.statistics.meter('http.redirects').mark();
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.warn('redirected request http' + ((secure) ? 's' : '') + ':%s#%s for %s to %s', port, count, request.url, redirect_to);
          }
          response.statusCode = '302';
          response.setHeader('Location', redirect_to);
          response.end();
        };

        //T: use native.url.parse/native.url.format?
        //C: getting url cleaned by querystring
        var cleaned_url = request.url;
        var query_marker = cleaned_url.indexOf('?');
        if (query_marker > -1) {
          cleaned_url = cleaned_url.substr(0, query_marker);
        }

        //F: Applies redirect filter and returns new location as string if matched
        var check_redirection = function (redirect_data) {
          if (redirect_data.filter != null) {
            //C: checking match against string
            if (typeof redirect_data.filter === 'string') {
              if (cleaned_url === redirect_data.filter) {
                return redirect_data.to;
              }
            //C: checking match against function
            } else if (typeof redirect_data.filter === 'function') {
              if (redirect_data.filter() === true) {
                return redirect_data.to;
              }
            //C: checking match against regexp
            } else if (redirect_data.filter.constructor === RegExp) {
              if (redirect_data.filter.test(cleaned_url) === true && (redirect_data.filter.lastIndex = 0) === 0) {
                return cleaned_url.replace(redirect_data.filter, redirect_data.to);
              }
            }
          }
          //C: no match found
          return null;
        };

        //C: checking if request should be redirected (port-specific)
        for(var redirector in redirect) {
          if (redirect.hasOwnProperty(redirector) === true) {
            //C: getting redirect data
            var redirect_data = redirect[redirector];
            //C: applying filter and getting redirection URI
            var redirect_to = check_redirection(redirect_data);
            if (redirect_to != null) {
              //C: preserving querystring parameters
              if (query_marker > -1){
                redirect_to += request.url.substr(query_marker);
              }
              //C: redirecting and exiting
              request.redirect(redirect_to);
              return;
            }
          }
        }

        //C: checking if request should be redirected (global default)
        for(var redirector in platform.configuration.server.http.default.redirect) {
          if (platform.configuration.server.http.default.redirect.hasOwnProperty(redirector) === true) {
            //C: getting redirect data
            var redirect_data = platform.configuration.server.http.default.redirect[redirector];
            //C: applying filter and getting redirection URI
            var redirect_to = check_redirection(redirect_data);
            if (redirect_to != null) {
              //C: preserving querystring parameters
              if (query_marker > -1){
                redirect_to += request.url.substr(query_marker);
              }
              //C: redirecting and exiting
              request.redirect(redirect_to);
              return;
            }
          }
        }

        //C: validating URL
        if ((reject.url||platform.configuration.server.http.default.reject.url).test(cleaned_url) === true && ((reject.url||platform.configuration.server.http.default.reject.url).lastIndex = 0) === 0) {
          //C: updating stats
          platform.statistics.meter('http.rejects').mark();
          //C: logging reject if debug enabled
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.warn('rejected client request http' + ((secure) ? 's' : '') + ':%s#%s with url %s not allowed', port, count, request.url);
          }
          //C: returning 404 status code (for security reason we do not reply with 403/406)
          response.statusCode = 404;
          //T: return json, html or text depending on acceptable content type
          if (request.method === 'HEAD') {
            response.end();
          } else {
            response.end("404 File not found");
          }
          return;
        }

        //C: logging new context if debug enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('creating context request http' + ((secure) ? 's' : '') + ':%s#%s', port, count);
        }

        //C: creating request-specific domain (required for call context)
        //T: migrate to contextify or similar for isolation?
        var domain = native.domain.create();

        domain.on('error', function (err) {
          //C: updating stats
          platform.statistics.meter('http.errors.server').mark();
        });

        //C: attaching to domain events error/dispose if debug is enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          domain.on('error', function (err) {
            console.warn('exception in request http' + ((secure) ? 's' : '') + ':%s#%s: %s', port, count, err.stack || err.message);
          });
          domain.on('dispose', function () {
            console.debug('disposing context request http' + ((secure) ? 's' : '') + ':%s#%s', port, count);
          });
        }

        //C: attaching to response finish event (request processing ended)
        response.on('finish', function () {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('finished client request http' + ((secure) ? 's' : '') + ':%s#%s with status %s in %s' + ((domain._context['response']._async === true) ? ' (async)' : ' (sync)'), port, count, domain._context['response'].statusCode, Number.toHumanTime(Date.now()-domain._context['request'].start));
          }
          //C: clearing context data
          if (domain._context != null) {
            delete domain._context['request'];
            delete domain._context['response'];
            delete domain._context['server'];
            delete domain._context['call'];
            domain._context = null;
          }
        });

        //C: attaching to request close event
        request.on('close', function () {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('closed client request http' + ((secure) ? 's' : '') + ':%s#%s', port, count);
          }
          //C: clearing context data
          if (domain._context != null) {
            delete domain._context['request'];
            delete domain._context['response'];
            delete domain._context['server'];
            delete domain._context['call'];
            domain._context = null;
          }
        });

        //C: logging request processing if debug enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('processing client request http' + ((secure) ? 's' : '') + ':%s#%s for %s', port, count, request.url);
        }

        //C: processing request within domain
        domain.run(function(){
          //C: creating http call context and storing through pseudo-thread-static context object
          //T: should be disposed somewhere? (maybe domain.dispose is sufficient)
          native.domain.active._context = platform.server.http.context.create(request, response, server);
          //C: processing request
          //T: complete port of multihost support from 0.3.x branch
          platform.engine.process.http();
        });

      });

      //C: instancing antive WebSocket server
      agent_websocket = new native.websocket.server({ noServer: true });

      //C: attaching to native HTTP listener upgrade event
      agent_http.on('upgrade', function(request, socket, upgradeHead) {
        //C: getting needed listener configurations
        var secure = this.secure;
        var port = this.port;
        var debug = this.debug;

        //C: creating request.client property (with address and port) to simulate common behavior
        request.client = {};
        var remote_address = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
        var remote_port = request.client.port = request.socket.remotePort || request.socket._peername.port;

        //C: logging connection if debug is enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('upgrading client request %s:%s for listener http' + ((secure) ? 's' : '') + ':%s', remote_address, remote_port, port);
        }

        //C: getting server object
        var server = this;

        //C: handling upgrade protocol
        switch(request.headers['upgrade']) {
          case 'websocket':
            //C: upgrading request to WebSocket
            agent_websocket.handleUpgrade(request, socket, upgradeHead, function (websocket) {
              //C: updating stats
              platform.statistics.meter('http.upgrades.websocket').mark();

              //C: logging new websocket if debug is enabled
              if (debug === true && platform.configuration.server.debugging.websocket === true) {
                console.debug('[ws' + ((secure) ? 's' : '') + ':%s] accepting new socket %s:%s', port, remote_address, remote_port);
              }

              //C: processing new websocket
              //T: complete port of multihost support from 0.3.x branch
              platform.engine.process.websocket(request, server, websocket);
            });
            break;
          default:
            //C: updating stats
            platform.statistics.meter('http.upgrades.unimplemented').mark();
            //C: rejecting unknown protocols
            request.reject(501,'Not implemented');
            break;
        }
      });

      agent_http.on('clientError', function (exception, socket) {
        //C: updating stats
        platform.statistics.meter('http.errors.client').mark();
      });

      //C: attaching to native HTTP listener connection/clientError/close events for debug log
      if (agent_http.debug === true && platform.configuration.server.debugging.http === true) {
        agent_http.on('connection', function (socket) {
          console.debug('accepting new client %s:%s for listener http' + ((this.secure) ? 's' : '') + ':%s', socket.remoteAddress, socket.remotePort, this.port);
        });
        agent_http.on('clientError', function (exception, socket) {
          console.warn('exception client %s:%s for listener http' + ((this.secure) ? 's' : '') + ':%s: %s', socket._peername.address, socket._peername.port, this.port, exception.stack);
        });
        agent_http.on('close', function () {
          console.debug('closed server for port %s', this.port);
        });
      }

      //C: storing native HTTP listener instance
      platform.server.http._agents[port] = {};
      platform.server.http._agents[port].http = agent_http;
      platform.server.http._agents[port].websocket = agent_websocket;
    });
  });
};

//C: initializing and starting HTTP(S) listeners
//T: move init and HTTP(S) start in PXE events
platform.server.http._init();
platform.server.http.start();

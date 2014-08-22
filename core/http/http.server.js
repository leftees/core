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
platform.server = platform.server || {};

//N: Provides HTTP web server management objects and methods.
platform.server.http = platform.server.http || {};

//V: Stores all the native HTTP(S) agent instances.
platform.server.http.__agents__ = platform.server.http.__agents__ || {};

//F: Starts application server HTTP(S) listeners.
//A: [port]: Specifies the port to be started. If missing, all configured ports will be started.
//R: None.
platform.server.http.start = function(port){
  //T: support unix socket too
  if (port != null){
    if (platform.server.http.__agents__.hasOwnProperty(port) === true) {
      platform.server.http.__agents__[port].http.listen(parseInt(port));
    } else {
      throw new Exception('no configuration available for port %s', port);
    }
  } else {
    Object.keys(platform.server.http.__agents__).forEach(function (port) {
      platform.server.http.__agents__[port].http.listen(parseInt(port));
    });
  }
};

//F: Stops application server HTTP(S) listeners.
//A: [port]: Specifies the port to be stopped. If missing, all configured ports will be stopped.
//R: None.
platform.server.http.stop = function(port){
  //T: support unix socket too
  if (port != null){
    if (platform.server.http.__agents__.hasOwnProperty(port) === true) {
      platform.server.http.__agents__[port].http.close();
    } else {
      throw new Exception('no configuration available for port %s', port);
    }
  } else {
    Object.keys(platform.server.http.__agents__).forEach(function (port) {
      platform.server.http.__agents__[port].http.close();
    });
  }
};

//F: Initializes HTTP(S) listeners.
platform.server.http.init = function() {
  //C creating native HTTP listener for each configured port
  Object.keys(platform.configuration.server.http.ports).forEach(function (portlist) {
    //C: getting port configuration
    var config = platform.configuration.server.http.ports[portlist];
    //C: splitting multiple ports (separated by '|')
    var ports = portlist.split('|');
    ports.forEach(function (port) {
      var agentHttp, agentWebSocket, options;
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
        agentHttp = native[protocol].createServer(native.httpauth[config.auth](
          {
            'realm': config.realm
          },
          platform.engine.process.auth[config.auth].bind(null,config.realm)
        ),options);
      } else {
        agentHttp = native[protocol].createServer(options);
      }

      //C: extending native http listener with config info
      agentHttp.secure = config.secure;
      agentHttp.debug = config.debug;
      agentHttp.limit = config.limit || platform.configuration.server.http.default.limit;
      agentHttp.auth = config.auth;
      agentHttp.realm = config.realm;
      agentHttp.port = port;
      agentHttp.redirect = config.redirect||{};
      agentHttp.reject = config.reject||{};

      //C: extending native http listener with request counter
      agentHttp.count = 0;

      //C: attaching to new request event
      agentHttp.on('request',function (request, response) {

        //C: getting needed listener configurations
        var secure = this.secure;
        var port = this.port;
        var debug = this.debug;
        var redirect = this.redirect;
        var reject = this.reject;

        //C: extending requestobject with needed properties from listener
        request.limit = this.limit;

        //C: creating request.client property (with address and port) to simulate common behavior
        request.client = {};
        var remoteAddress = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
        var remotePort = request.client.port = request.socket.remotePort || request.socket._peername.port;

        //C: incrementing request count for listener and using it as request.id property
        if (this.count === Number.MAX_VALUE) {
          this.count = 0;
        }
        var count = request.id = ++this.count;

        //C: extending request object with HTTP redirect function
        request.redirect = function (redirect_to) {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.warn('[http' + ((secure) ? 's' : '') + ':%s] redirected request #%s from %s:%s: from \'%s\' to \'%s\'', port, count, remoteAddress, remotePort, request.url, redirect_to);
          }
          response.statusCode = '302';
          response.setHeader('Location', redirect_to);
          response.end();
        };

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
            //C: chacking match against regexp
            } else if (redirect_data.filter.constructor === RegExp) {
              if (redirect_data.filter.test(cleaned_url) === true) {
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
        if ((reject.url||platform.configuration.server.http.default.reject.url).test(cleaned_url) === true) {
          //C: logging reject if debug enabled
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.warn('[http' + ((secure) ? 's' : '') + ':%s] rejected client request #%s from %s:%s: url \'%s\' not allowed', port, count, remoteAddress, remotePort, request.url);
          }
          //C: returning 404 status code (for security reason we do not reply with 403/406)
          response.statusCode = 404;
          //T: return json, html or text depending on acceptable content type
          response.end ("404 File not found");
          return;
        }

        //T: complete port of multihost support from 0.3.x branch
        //C: logging new context if debug enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('[http' + ((secure) ? 's' : '') + ':%s] creating context request #%s from %s:%s', port, count, remoteAddress, remotePort);
        }

        //C: creating request-specific domain (required for call context)
        //T: migrate to contextify or similar for isolation?
        var domain = native.domain.create();

        //C: attaching to domain events error/dispose if debug is enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          domain.on('error', function (err) {
            console.warn('[http' + ((secure) ? 's' : '') + ':%s] exception in request #%s from %s:%s: %s', port, count, remoteAddress, remotePort, err);
          });
          domain.on('dispose', function () {
            console.debug('[http' + ((secure) ? 's' : '') + ':%s] disposing context request #%s from %s:%s', port, count, remoteAddress, remotePort);
          });
        }

        //C: attaching to domain end event (request processing ended)
        request.on('end', function () {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('[http' + ((secure) ? 's' : '') + ':%s] finished client request #%s from %s:%s', port, count, remoteAddress, remotePort);
          }
          //C: disposing domain
          domain.dispose();
        });

        //C: attaching to domain close event (domain closed?)
        request.on('close', function () {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('[http' + ((secure) ? 's' : '') + ':%s] closed client request #%s from %s:%s', port, count, remoteAddress, remotePort);
          }
          //C: disposing domain
          domain.dispose();
        });

        //C: logging request processing if debug enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('[http' + ((secure) ? 's' : '') + ':%s] processing client request #%s from %s:%s', port, count, remoteAddress, remotePort);
        }

        //C: processing request within domain
        domain.run(function(){
          platform.engine.process.http(request, response, this);
        });

      });

      //C: instancing antive WebSocket server
      agentWebSocket = new native.websocket.server({ noServer: true });

      //C: attaching to native HTTP listener upgrade event
      agentHttp.on('upgrade', function(request, socket, upgradeHead) {
        //C: getting needed listener configurations
        var secure = this.secure;
        var port = this.port;
        var debug = this.debug;

        //C: creating request.client property (with address and port) to simulate common behavior
        request.client = {};
        var remoteAddress = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
        var remotePort = request.client.port = request.socket.remotePort || request.socket._peername.port;

        //C: logging connection if debug is enabled
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('[http' + ((secure) ? 's' : '') + ':%s] upgrading client request %s:%s', port, remoteAddress, remotePort);
        }

        //C: getting server object
        var server = this;

        //C: handling upgrade protocol
        switch(request.headers['upgrade']) {
          case 'websocket':
            //C: upgrading request to WebSocket
            agentWebSocket.handleUpgrade(request, socket, upgradeHead, function (websocket) {
              //C: logging new websocket if debug is enabled
              if (debug === true && platform.configuration.server.debugging.websocket === true) {
                console.debug('[ws' + ((secure) ? 's' : '') + ':%s] accepting new socket %s:%s', port, remoteAddress, remotePort);
              }

              //C: processing new websocket
              //T: complete port of multihost support from 0.3.x branch
              platform.engine.process.websocket(request, server, websocket);
            });
            break;
          default:
            //C: rejecting unknown protocols
            request.reject(501,'Not implemented');
            break;
        }
      });

      //C: attaching to native HTTP listener connection/clientError/close events for debug log
      if (agentHttp.debug === true && platform.configuration.server.debugging.http === true) {
        agentHttp.on('connection', function (socket) {
          console.debug('[http' + ((this.secure) ? 's' : '') + ':%s] accepting new client %s:%s', this.port, socket.remoteAddress, socket.remotePort);
        });
        agentHttp.on('clientError', function (exception, socket) {
          console.warn('[http' + ((this.secure) ? 's' : '') + ':%s] exception new client %s:%s: %s', this.port, socket.remoteAddress, socket.remotePort, exception.message);
          console.warn(exception);
        });
        agentHttp.on('close', function () {
          console.debug('closed server for port %s', this);
        });
      }

      //C: storing native HTTP listener instance
      platform.server.http.__agents__[port] = {};
      platform.server.http.__agents__[port].http = agentHttp;
      platform.server.http.__agents__[port].websocket = agentWebSocket;
    });
  });
};

//C: initializing and starting HTTP(S) listeners
//T: move init and HTTP(S) start in PXE events
platform.server.http.init();
platform.server.http.start();

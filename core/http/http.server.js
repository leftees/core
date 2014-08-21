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
  Object.keys(platform.configuration.server.http.ports).forEach(function (portlist) {
    var config = platform.configuration.server.http.ports[portlist];
    var ports = portlist.split('|');
    ports.forEach(function (port) {
      var agentHttp, agentWebSocket, options;
      if (config.secure === true) {
        options = {};
        if (config.pfx == null && config.cert == null) {
          options.pfx = null;
          options.passphrase = null;
          options.cert = native.fs.readFileSync(platform.runtime.path.core + '/core/ssl/self.crt');
          options.key = native.fs.readFileSync(platform.runtime.path.core + '/core/ssl/self.key');
        } else {
          //T: convert pfx, key, cert, ca[] from file paths to file data (requires mapPath)
        }
        options.ciphers = config.ciphers || 'HIGH !aNULL !eNULL !MEDIUM !LOW !3DES !MD5 !EXP !PSK !SRP !DSS';
        var protocols = config.protocols || {
          'SSLv3': false,
          'TLSv10': true,
          'TLSv11': true,
          'TLSv12': true
        };
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
      config.debug = (config.debug == null || config.debug === true);
      var protocol = (config.secure === true) ? 'https' : 'http';

      //T: implement http auth internally (dismiss http-auth module)
      if (config.auth === 'basic' || config.auth === 'digest') {
        agentHttp = native[protocol].createServer(native.httpauth[config.auth](
          {
            'realm': config.realm
          },
          platform.engine.process.auth[config.auth].bind(null,config.realm)
        ),options);
      } else {
        agentHttp = native[protocol].createServer(options);
      }
      agentHttp.secure = config.secure;
      agentHttp.debug = config.debug;
      agentHttp.limit = config.limit || platform.configuration.server.http.default.limit;
      agentHttp.auth = config.auth;
      agentHttp.realm = config.realm;
      agentHttp.port = port;
      agentHttp.count = 0;
      agentHttp.on('request',function (request, response) {
        var secure = this.secure;
        var port = this.port;
        var debug = this.debug;
        if (this.count === Number.MAX_VALUE) {
          this.count = 0;
        }
        var count = request.id = ++this.count;
        request.limit = this.limit;
        request.client = {};
        var remoteAddress = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
        var remotePort = request.client.port = request.socket.remotePort || request.socket._peername.port;

        var cleaned_url = request.url;
        var query_marker = cleaned_url.indexOf('?');
        if(query_marker > -1) {
          cleaned_url = cleaned_url.substr(0,query_marker);
        }

        for(var redirect in platform.configuration.server.http.default.redirect) {
          if (platform.configuration.server.http.default.redirect.hasOwnProperty(redirect) === true) {
            var redirect_data = platform.configuration.server.http.default.redirect[redirect];
            var redirect_to = null;
            if (redirect_data.filter != null) {
              if (typeof redirect_data.filter === 'string') {
                if (cleaned_url === redirect_data.filter) {
                  redirect_to = redirect_data.to;
                }
              } else if (redirect_data.filter.constructor === RegExp) {
                if (redirect_data.filter.test(cleaned_url) === true) {
                  redirect_to = cleaned_url.replace(redirect_data.filter, redirect_data.to);
                }
              }
            }
            if (redirect_to != null) {
              if(query_marker > -1) {
                redirect_to += request.url.substr(query_marker);
              }
              if (debug === true && platform.configuration.server.debugging.http === true) {
                console.warn('[http' + ((secure) ? 's' : '') + ':%s] redirected request #%s from %s:%s: from \'%s\' to \'%s\'', port, count, remoteAddress, remotePort, request.url, redirect_to);
              }
              response.statusCode = '302';
              response.setHeader('Location', redirect_to);
              response.end();
              return;
            }
          }
        }

        if (platform.engine.process.auth.url(cleaned_url) === false) {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.warn('[http' + ((secure) ? 's' : '') + ':%s] rejected client request #%s from %s:%s: url \'%s\' not allowed', port, count, remoteAddress, remotePort, request.url);
          }
          response.statusCode = 404;
          //T: return json, html or text depending on acceptable content type
          response.end ("404 File not found");
          return;
        }

        //T: complete port of multihost support from 0.3.x branch
        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('[http' + ((secure) ? 's' : '') + ':%s] creating context request #%s from %s:%s', port, count, remoteAddress, remotePort);
        }
        var domain = native.domain.create();

        if (debug === true && platform.configuration.server.debugging.http === true) {
          domain.on('error', function (err) {
            console.warn('[http' + ((secure) ? 's' : '') + ':%s] exception in request #%s from %s:%s: %s', port, count, remoteAddress, remotePort, err);
          });
          domain.on('dispose', function () {
            console.debug('[http' + ((secure) ? 's' : '') + ':%s] disposing context request #%s from %s:%s', port, count, remoteAddress, remotePort);
          });
        }

        request.on('end', function () {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('[http' + ((secure) ? 's' : '') + ':%s] finished client request #%s from %s:%s', port, count, remoteAddress, remotePort);
          }
          domain.dispose();
        });
        request.on('close', function () {
          if (debug === true && platform.configuration.server.debugging.http === true) {
            console.debug('[http' + ((secure) ? 's' : '') + ':%s] closed client request #%s from %s:%s', port, count, remoteAddress, remotePort);
          }
          domain.dispose();
        });

        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('[http' + ((secure) ? 's' : '') + ':%s] processing client request #%s from %s:%s', port, count, remoteAddress, remotePort);
        }
        domain.run(function(){
          platform.engine.process.http(request, response, this);
        });
      });
      agentWebSocket = new native.websocket.server({ noServer: true });
      agentHttp.on('upgrade', function(request, socket, upgradeHead) {
        var secure = this.secure;
        var port = this.port;
        var debug = this.debug;
        request.client = {};
        var remoteAddress = request.client.address = request.socket.remoteAddress || request.socket._peername.address;
        var remotePort = request.client.port = request.socket.remotePort || request.socket._peername.port;

        if (debug === true && platform.configuration.server.debugging.http === true) {
          console.debug('[http' + ((secure) ? 's' : '') + ':%s] upgrading client request %s:%s', port, remoteAddress, remotePort);
        }

        var head = new Buffer(upgradeHead.length);
        upgradeHead.copy(head);

        var server = this;
        agentWebSocket.handleUpgrade(request, socket, head, function(websocket) {
          if (debug === true && platform.configuration.server.debugging.websocket === true) {
            console.debug('[ws' + ((secure) ? 's' : '') + ':%s] accepting new socket %s:%s', port, remoteAddress, remotePort);
          }

          //T: complete port of multihost support from 0.3.x branch
          platform.engine.process.websocket(request, server, websocket);
        });
      });
      if (agentHttp.debug === true && platform.configuration.server.debugging.http === true) {
        agentHttp.on('connection', function (socket) {
          console.debug('[http' + ((this.secure) ? 's' : '') + ':%s] accepting new client %s:%s', this.port, socket.remoteAddress, socket.remotePort);
        });
        agentHttp.on('clientError',function (exception, socket) {
          console.warn('[http' + ((this.secure) ? 's' : '') + ':%s] exception new client %s:%s: %s', this.port, socket.remoteAddress, socket.remotePort, exception.message);
          console.warn(exception);
        });
      }
      agentHttp.on('close',function () {
        console.debug('closed server for port %s',this);
      });
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

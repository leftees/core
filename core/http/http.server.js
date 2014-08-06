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
  if (port !== undefined && port !== null){
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
  if (port !== undefined && port !== null){
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
      var agentHttp, agentWebSocket;
      if (config.secure === true) {
        var options = {};
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
        agentHttp = native.https.createServer(options);
        agentHttp.secure = true;
      } else {
        agentHttp = native.http.createServer();
        agentHttp.secure = false;
      }
      agentWebSocket = new native.websocket.server({ noServer: true });
      agentHttp.port = port;
      agentHttp.on('request',function (request, response) {
        var secure = this.secure;
        var port = this.port;
        var remoteAddress = request.socket.remoteAddress;
        var remotePort = request.socket.remotePort;
        console.debug('[http' + ((secure) ? 's' : '')  + ':%s] processing client request %s:%s',port,remoteAddress,remotePort);
        response.on('finish',function(){
          console.debug('[http' + ((secure) ? 's' : '')  + ':%s] finished client request %s:%s',port,remoteAddress,remotePort);
        });
        response.on('close',function(){
          console.debug('[http' + ((secure) ? 's' : '')  + ':%s] closed client request %s:%s',port,remoteAddress,remotePort);
        });
        //T: complete port of multihost support from 0.3.x branch
        platform.engine.process.http(new platform.server.http.context(request, response, this));
      });
      agentHttp.on('upgrade', function(request, socket, upgradeHead) {
        var secure = this.secure;
        var port = this.port;
        var remoteAddress = request.socket.remoteAddress;
        var remotePort = request.socket.remotePort;

        console.debug('[http' + ((secure) ? 's' : '')  + ':%s] upgrading client request %s:%s',port,remoteAddress,remotePort);

        var head = new Buffer(upgradeHead.length);
        upgradeHead.copy(head);
        agentWebSocket.handleUpgrade(request, socket, head, function(websocket) {
          console.debug('[ws' + ((secure) ? 's' : '')  + ':%s] accepting new socket %s:%s',port,remoteAddress,remotePort);

          //T: complete port of multihost support from 0.3.x branch
          platform.engine.process.websocket(request.headers, websocket);
        });
      });
      agentHttp.on('connection',function (socket) {
        console.debug('[http' + ((this.secure) ? 's' : '')  + ':%s] accepting new client %s:%s',this.port,socket.remoteAddress,socket.remotePort);
      });
      agentHttp.on('clientError',function (exception, socket) {
        console.error(exception.message,exception);
      });
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

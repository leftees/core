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
 * Contains cluster namespace with related objects and methods.
 * @namespace
*/
platform.cluster = platform.cluster || {};

/**
 * Contains cluster IPC related objects and methods.
 * @namespace
*/
platform.cluster.ipc = platform.cluster.ipc || {};

/**
 * Stores IPC connections (net.js sockets) decorated with custom properties and methods.
 * @type {Object}
*/
platform.cluster.ipc.connections = platform.cluster.ipc.connections || {};

/**
 * Stores IPC related events.
 * @type {Object}
*/
platform.cluster.ipc.events = platform.cluster.ipc.events || {};

/**
 * Stores IPC related server-specific events.
 * @type {Object}
*/
platform.cluster.ipc.events.server = platform.cluster.ipc.events.server || {};

/**
 * Handle IPC server connection event.
 * @param {} ipc_client References the socket created to manage incoming connection.
*/
platform.cluster.ipc.events.server.connection = function(ipc_client){
  var ipc_server = this;
  //TODO: security check?
  // logging
  if (platform.configuration.debug.ipc === true){
    console.debug('new ipc incoming connection');
  }
  // decorating the new connection socket with ipc.socket factory
  platform.cluster.ipc.socket.create(ipc_server.type,ipc_client);
  // setting the socket property passive to allow in/out awareness
  ipc_client.passive = true;
};

/**
 * Initialize IPC server.
*/
platform.cluster.ipc.events.server.close = function(){
  var ipc_server = this;
  // logging
  if (platform.configuration.debug.ipc === true){
    console.debug('ipc server stopped');
  }
  // deleting the binded unix socket (only unix sockets are currently supported)
  if(platform.io.existsSync(ipc_server.path) === true){
    platform.io.deleteSync(ipc_server.path);
  }
  //TODO: if closed because of error, restart...
  //process.exit();
};

/**
 * Handles errors occurring in IPC server.
 * @param {} err The exception caught from the IPC listener.
*/
platform.cluster.ipc.events.server.error = function(err){
  var ipc_server = this;
  // logging
  if (platform.configuration.debug.ipc === true){
    console.debug('exception for ipc server: %s', err.stack);
  }
  //TODO: close or restart?
};

/**
 * Stores IPC related client-specific events.
 * @type {Object}
*/
platform.cluster.ipc.events.client = platform.cluster.ipc.events.client || {};

/**
 * Initialize IPC server.
*/
platform.cluster.ipc.events.client.connect = function(){
  var ipc_client = this;
  // logging
  if (platform.configuration.debug.ipc === true){
    console.debug('ipc connection established');
  }
  // checking if ipc client is not initialized
  if (ipc_client.id == null) {
    // sending first packet with node identity data (only occur in initial packet exchange)
    var packet = {
      'id': platform.cluster.worker.id,
      'nid': native.cluster.worker.id,
      'role': platform.cluster.worker.role,
      'debug': process.debugPort,
      'uri': ipc_client.uri.local
    };
    ipc_client.send(packet);
  }
};

/**
 * Initialize IPC server.
*/
platform.cluster.ipc.events.client.message = function(data){
  var ipc_client = this;
  // trying to convert data to object
  try {
    var packet;
    if (ipc_client.encoder == null) {
      //packet = JSON.parse(data.toString());
      packet = JSON.parseAndNormalize(data.toString());
    } else {
      packet = ipc_client.encoder.decode(data);
    }
    if(platform.configuration.debug.ipc_dump === true) {
      console.debug('ipc packet received from %s:',ipc_client.id);
      console.debug(packet);
    }
  } catch(ex) {
    if (platform.configuration.debug.ipc === true) {
      console.warn('lost ipc packet from node %s: invalid json', ipc_client.id);
      console.warn(packet);
    }
  }
  // checking whether the packet is available
  if (packet != null) {
    // checking if ipc client is not initialized (i.e. we're processing very first packet from remote node)
    if (ipc_client.id == null) {
      // decorating the socket object with extended properties
      ipc_client.id = packet.id;
      ipc_client.nid = packet.nid;
      ipc_client.role = packet.role;
      ipc_client.uri.remote = packet.uri;
      ipc_client.packets = {};
      // adding arrays to queue request/responses
      ipc_client.packets.in = [];
      ipc_client.packets.out = [];
      // adding object to store callback data in duplex packets
      ipc_client.packets.cb = {};
      ipc_client.packets.cb.index = 0;
      // checking if we need to answer the very first packet
      if (ipc_client.passive === true) {
        // saving the remote debug port if any (for development tools)
        if (platform.cluster.worker.master === true && packet.debug != null) {
          platform.cluster.workers[ipc_client.nid].debugPort = packet.debug;
        }
        // sending the packet answer to finalize initialization
        packet = {
          'id': platform.cluster.worker.id,
          'nid': (native.cluster.worker) ? native.cluster.worker.id : '0',
          'role': platform.cluster.worker.role,
          'uri': ipc_client.uri.local
        };
        ipc_client.send(packet);
      } else {
        // logging
        if (platform.configuration.debug.ipc === true) {
          console.debug('ipc with node %s initialized', ipc_client.id);
        }
      }
      //TODO: check if it's a reconnection
      // adding connection to available connections
      platform.cluster.ipc.connections[ipc_client.id] = ipc_client;
      platform.events.raise('cluster.ipc.handshake',ipc_client.id,ipc_client.uri.remote,ipc_client);
    } else {
      // detecting whether the packet is a response for a duplex packet
      if (packet.protocol == null && packet.cid != null) {
        // checking whether the callback object is already available
        var cid = packet.cid;
        if (ipc_client.packets.cb.hasOwnProperty(cid) === true) {
          // getting the callback function to invoke with the response
          var cb = ipc_client.packets.cb[cid];
          if (packet.error != null){
            cb(packet.error);
          } else {
            cb(null,packet.result);
          }
          // delete callback object to prevent further invoke
          delete ipc_client.packets.cb[cid];
        }
      } else {
        // checking whether the packet is valid (should have at least the protocol property
        var protocol = packet.protocol;
        if (protocol != null) {
          // checking whether the protocol exists
          if (platform.cluster.ipc.protocols.exists(protocol) === true) {
            // logging
            if (platform.configuration.debug.ipc === true) {
              console.debug('received ipc packet from node %s for protocol %s', ipc_client.id, protocol);
            }
            // checking whether the packet is duplex (contains the cid - callback id - property)
            if (packet.cid != null) {
              // processing packet through proper protocol in async mode
              platform.cluster.ipc.protocols._process(protocol, ipc_client, packet.data, platform.cluster.ipc.events.callback.bind(ipc_client, packet.cid, packet.protocol));
            } else {
              // processing packet through proper protocol in sync mode
              platform.cluster.ipc.protocols._process(protocol, ipc_client, packet.data);
            }
          } else {
            // logging
            if (platform.configuration.debug.ipc === true) {
              console.debug('rejected ipc packet from node %s for protocol %s: unsupported protocol', ipc_client.id, protocol);
            }
          }
        } else {
          // logging
          if (platform.configuration.debug.ipc === true) {
            console.debug('rejected ipc packet from node %s: invalid format', ipc_client.id);
          }
        }
      }
    }
  }
};

/**
 * Handles the client close event.
 * @param {} had_error Specifies whether the connection has been closed because of errors, as boolean.
*/
platform.cluster.ipc.events.client.close = function(had_error){
  var ipc_client = this;
  // logging
  if (had_error === true) {
    if (platform.configuration.debug.ipc === true) {
      console.debug('ipc node %s disconnected', ipc_client.id);
    }
  } else {
    if (platform.configuration.debug.ipc === true){
      console.debug('ipc node %s disconnected because of exception',ipc_client.role,ipc_client.id);
    }
  }
  //TODO: reconnect if was active connection (ipc_client.passive === false)
};

/**
 * Handles exceptions occurring in client connection.
 * @param {} err References the caught error object.
*/
platform.cluster.ipc.events.client.error = function(err){
  var ipc_client = this;
  if (platform.configuration.debug.ipc === true){
    console.debug('ipc exception for node %s: %s',ipc_client.id,err.stack);
  }
};

/**
 * Handles the done event for packet callback (it's indeed the callback to forward results to remote node/callback).
 * @param {} cid The remote callback id from the received packet.
 * @param {} [error] The caught error object, if any.
 * @param {} [result] The invoke/call result, if any.
*/
platform.cluster.ipc.events.callback = function(cid,protocol,error,result){
  //TODO: move to extended serialization (with deep recursive check?)
  if (result != null && result.constructor === Promise){
    result.then(
      platform.cluster.ipc.events.callback.bind(this,cid,protocol,null),
      platform.cluster.ipc.events.callback.bind(this,cid,protocol)
    );
    return;
  }
  if (error != null && error.constructor === Promise){
    error.then(
      platform.cluster.ipc.events.callback.bind(this,cid,protocol),
      platform.cluster.ipc.events.callback.bind(this,cid,protocol)
    );
    return;
  }
  var ipc_client = this;
  // creating a new packet
  var packet = platform.kernel.new('core.ipc.packet');
  //packet.destination = ipc_client.id;
  packet.cid = cid;
  packet.error = (error != null) ? (new Exception(error)) : undefined;
  packet.result = result;
  if (platform.configuration.debug.ipc === true){
    if (packet.error != null) {
      console.error('ipc callback error for node %s: callback id %s for protocol %s with error %s', ipc_client.id, cid, protocol, error.stack || error.message);
      if (platform.configuration.debug.exception === true) {
        console.dir(error);
      }
    } else {
      console.debug('ipc callback done for node %s: callback id %s for protocol %s', ipc_client.id, cid, protocol);
    }
  }
  //TODO: use extended serialization?
  // sending response to the duplex packet
  ipc_client.send(packet);
};

/**
 * Initialize IPC server.
*/
platform.cluster.ipc._init = function(){
  // ensuring that the temporary unix sockets folder exists
  platform.io.createSync('/tmp/ipc/sockets/');
  // instancing net.js socket server
  var ipc_server_unix = new native.net.Server();
  ipc_server_unix.type = 'unix';
  // decorating the socket with path property, containing the unix path
  ipc_server_unix.path = platform.io.map('/tmp/ipc/sockets/'+platform.cluster.worker.id);
  ipc_server_unix.uri = 'unix://' + platform.cluster.worker.id;
  // attaching server events to handlers
  ipc_server_unix.on('connection',platform.cluster.ipc.events.server.connection);
  ipc_server_unix.on('close',platform.cluster.ipc.events.server.close);
  ipc_server_unix.on('error',platform.cluster.ipc.events.server.error);
  // storing IPC server object
  platform.cluster.worker.ipc.server.unix = ipc_server_unix;

  // instancing net.js socket server
  var ipc_server_tcp = new native.net.Server();
  ipc_server_tcp.type = 'tcp';
  ipc_server_tcp.host = platform.configuration.cluster.ipc.transports.tcp.host;
  ipc_server_tcp.port = platform.configuration.cluster.ipc.transports.tcp.port
    + ((native.cluster.isMaster) ? 0 : native.cluster.worker.id);
  ipc_server_tcp.uri = 'tcp://' + platform.configuration.cluster.ipc.transports.tcp.host + ':' + ipc_server_tcp.port;
  // attaching server events to handlers
  ipc_server_tcp.on('connection',platform.cluster.ipc.events.server.connection);
  ipc_server_tcp.on('close',platform.cluster.ipc.events.server.close);
  ipc_server_tcp.on('error',platform.cluster.ipc.events.server.error);
  // storing IPC server object
  platform.cluster.worker.ipc.server.tcp = ipc_server_tcp;

  // creating loopback socket
  platform.cluster.ipc.connections[platform.cluster.worker.id] = platform.cluster.ipc.socket.create('loopback');
};

/**
 * Starts the IPC server (listening).
*/
platform.cluster.ipc.start = function(){
  // starting socket on path
  platform.cluster.worker.ipc.server.unix.listen(platform.cluster.worker.ipc.server.unix.path);

  // starting socket on path
  platform.cluster.worker.ipc.server.tcp.listen(platform.cluster.worker.ipc.server.tcp.port,platform.cluster.worker.ipc.server.tcp.host);
};

/**
 * Stops the IPC server.
*/
platform.cluster.ipc.stop = function(){
  platform.cluster.worker.ipc.server.unix.close();
  platform.cluster.worker.ipc.server.tcp.close();
};

// Contains IPC socket helpers objects and methods.
platform.cluster.ipc.socket = platform.cluster.ipc.socket || {};

/**
 * Creates and/or decorate a socket with IPC extensions.
*/
platform.cluster.ipc.socket.create = function(type,socket){
  var loopback = (type === 'loopback');
  //TODO: extend socket class/prototype?
  // creating a new net.js socket if required
  if (socket == null) {
    if (loopback !== true) {
      socket = new native.net.Socket();
    } else {
      socket = new native.events.EventEmitter();
    }
  }
  socket.uri = {
    'remote': null,
    'local': null
  };
  switch(type){
    case 'loopback':
      break;
    case 'unix':
      socket.uri.local = platform.cluster.worker.ipc.server.unix.uri;
      break;
    case 'tcp':
      socket.uri.local = platform.cluster.worker.ipc.server.tcp.uri;
      break;
    default:
      throw new Exception('unsupported ipc transport type: %s', type);
      break;
  }
  //socket.setNoDelay(true);
  // decorating socket object with properties
  //socket.busy = false;
  if (loopback !== true) {
    socket.id = null;
  } else {
    socket.id = platform.cluster.worker.id;
  }
  socket.type = type||'unix';
  if (loopback !== true) {
    socket.role = null;
  } else {
    socket.role = platform.cluster.worker.role;
  }
  socket.buffer = null;
  socket.passive = false;
  if (loopback !== true) {
    if (platform.configuration.cluster.ipc.transports[socket.type].encoder != null && platform.configuration.cluster.ipc.transports[socket.type].encoder != ''){
      socket.encoder = platform.kernel.new(platform.configuration.cluster.ipc.transports[socket.type].encoder);
    }
  }
  /*socket._native_write = socket.write;
  socket.write = function(chunk,encoding,cb){
    socket.busy = true;
    return socket._native_write(chunk,encoding,function(){
      socket.busy = false;
      if (cb != null) {
        cb.call(socket);
      }
    });
  };*/
  if (loopback === true){
    socket.write = function(chunk,encoding,cb){
      socket.emit('data',chunk);
      if (cb != null){
        cb();
      }
    };
    socket.pause = function(){};
    socket.resume = function(){};
    // decorating the socket object with extended properties
    socket.nid = (native.cluster.worker) ? native.cluster.worker.id : '0';
    socket.packets = {};
    // adding arrays to queue request/responses
    socket.packets.in = [];
    socket.packets.out = [];
    // adding object to store callback data in duplex packets
    socket.packets.cb = {};
    socket.packets.cb.index = 0;
  }
  // defining IPC send with packet headers support
  socket.send = function(chunk,encoding,cb){
    if(platform.configuration.debug.ipc_dump === true) {
      console.debug('ipc packet sent to %s:',socket.id);
      console.debug(chunk);
    }
    if (chunk == null) {
      throw new Exception('invalid data');
    } else {
      if (typeof chunk === 'string') {
        chunk = new Buffer(chunk);
      } else if (chunk.constructor !== Buffer) {
        //TODO: use extended serialization
        if (socket.encoder == null) {
          chunk = new Buffer(JSON.stringify(chunk));
        } else {
          chunk = new Buffer(socket.encoder.encode(chunk));
        }
      }
    }
    //TODO: check chunk type and serialize to buffer or string?
    // getting the chunk length
    var packet_length = chunk.length;
    // creating 4 bytes header with packet length
    var header_bytes = new Buffer(4);
    header_bytes.writeUInt32BE(packet_length,0);
    // sending header
    socket.write(header_bytes);
    // sending chunk/data
    socket.write(chunk,encoding,cb);
  };
  /**
  * processes data received to detect packets
  */
  var process_data = function(data){
    this.pause();
    var chunk = data;
    while (chunk != null && chunk.length > 0){
      chunk = process_chunk.call(this,chunk);
    }
    this.resume();
  };
  var process_chunk = function(chunk){
    var chunk_length = chunk.length;
    if (this.buffer == null) {
      if (this.header == null) {
        this.header = new Buffer(4);
        this.header.remaining = 4;
      }
      var header_remaining = this.header.remaining;
      if (this.header.remaining > 0) {
        if (chunk_length >= header_remaining) {
          chunk.copy(this.header, 4 - header_remaining, 0, header_remaining);
          this.header.remaining = 0;
          chunk = chunk.slice(header_remaining);
        } else {
          chunk.copy(this.header, 4 - header_remaining);
          this.header.remaining -= chunk.length;
          return;
        }
      }
      if (this.header.remaining === 0) {
        var new_packet_length = this.header.readUInt32BE(0);
        this.buffer = new Buffer(new_packet_length);
        this.buffer.remaining = new_packet_length;
        this.header = null;
      }
    }
    if (this.buffer != null){
      var remaining_bytes = this.buffer.remaining;
      var packet_length = this.buffer.length;
      chunk_length = chunk.length;
      if (chunk_length >= remaining_bytes){
        chunk.copy(this.buffer,packet_length-remaining_bytes,0,remaining_bytes);
        this.emit('message',this.buffer);
        this.buffer = null;
        chunk = chunk.slice(remaining_bytes);
      } else {
        chunk.copy(this.buffer,packet_length-remaining_bytes);
        this.buffer.remaining -= chunk_length;
        return;
      }
    }
    /*if (chunk.length > 0){
      var self = this;
      process.nextTick(function(){
        process_chunk.call(self,chunk);
      });
    }*/
    return chunk;
  };
  // attaching socket events to centralized handlers
  socket.priority = false;
  //socket.on('data',process_chunk);
  socket.on('data',function(data){
    var self = this;
    if (this.priority === false){
      setImmediate(function(){process_data.call(self,data)});
    } else {
      process.nextTick(function(){process_data.call(self,data)});
    }
  });
  socket.on('connect',platform.cluster.ipc.events.client.connect);
  socket.on('message',platform.cluster.ipc.events.client.message);
  socket.on('close',platform.cluster.ipc.events.client.close);
  socket.on('error',platform.cluster.ipc.events.client.error);
  return socket;
};

/**
 * Sends data to remote nodes in both sync/async modes.
 * @param {} destinations Specifies the destination, as string, or multiple destinations, as array of strings.
 * @param {} protocol Specifies the protocol to be used for packet handling, as string.
 * @param {} data Specifies the data to be sent, as object.
 * @param {} [callback] Specifies the callback whether the packet should be a duplex.
 * @return {} Returns number of packets sent (one for each resolved destination).
*/
platform.cluster.ipc.sendAwait = function(destinations,protocol,data,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  // checking/resolving destinations
  var resolved_destinations = platform.cluster.ipc.destinations.resolve(destinations);

  switch(resolved_destinations.length) {
    case 0:
      callback.reject(new Exception('no destinations found matching %s: send aborted',destinations));
      break;
    case 1:
      var wildchar_destinations = true;
      if (resolved_destinations.length === 1 && destinations === resolved_destinations[0]) {
        wildchar_destinations = false;
      }
      platform.cluster.ipc._send(resolved_destinations[0],protocol,data,function(error,result){
        if (error != null) {
          if (wildchar_destinations === true) {
            var errors = [error];
            errors.failed = resolved_destinations;
            errors.succeed = [];
            errors.destinations = resolved_destinations;
            callback.reject(errors);
          } else {
            callback.reject(error);
          }
        } else {
          if (wildchar_destinations === true) {
            var results = [result];
            results.failed = [];
            results.succeed = resolved_destinations;
            results.destinations = resolved_destinations;
            callback.resolve(results);
          } else {
            callback.resolve(result);
          }
        }
      });
      break;
    default:
      var has_errors = false;
      var results = [];
      results.succeed = [];
      results.failed = [];
      results.destinations = resolved_destinations;
      var tasks = [];
      resolved_destinations.forEach(function (destination,index,array) {
        tasks.push(function(task_callback) {
          platform.cluster.ipc._send(destination,protocol,data,function(task_error,task_result){
            if (task_error != null){
              has_errors = true;
              results.failed.push(resolved_destinations[index]);
              results[index] = task_error;
            } else {
              results.succeed.push(resolved_destinations[index]);
              results[index] = task_result;
            }
            task_callback();
          });
        });
      });
      native.async.parallel(tasks,function(){
        if (has_errors === true){
          callback.reject(results);
        } else {
          callback.resolve(results);
        }
      });
      break;
  }

  return callback.promise;
};

/**
 * Sends data to remote nodes in both sync/async modes.
 * @param {} destinations Specifies the destination, as string, or multiple destinations, as array of strings.
 * @param {} protocol Specifies the protocol to be used for packet handling, as string.
 * @param {} data Specifies the data to be sent, as object.
 * @param {} [callback] Specifies the callback whether the packet should be a duplex.
 * @return {} Returns number of packets sent (one for each resolved destination).
*/
platform.cluster.ipc._send = function(destination,protocol,data,callback){
  // getting destination socket (here destinations have been already validated and split to single destination)
  var ipc_client = platform.cluster.ipc.connections[destination];
  if (ipc_client == null) {
    // logging
    if (platform.configuration.debug.ipc === true){
      console.warn('ipc packet skipped to node %s for protocol %s: connection not available', ipc_client.id, protocol);
    }
  }

  // creating new packet
  var packet = platform.kernel.new('core.ipc.packet');
  // creating packet id and callback object if any (i.e. promoting packet to duplex)
  if (callback != null) {
    // preventing number overflow
    if (ipc_client.packets.cb.index === Number.MAX_VALUE) {
      ipc_client.packets.cb.index = 0;
      if (platform.configuration.debug.ipc === true) {
        console.debug('resetting callback id counter because of max value reached in ipc client %s', ipc_client.id);
      }
    }
    // generating/increasing callback id
    var callback_index = ++ipc_client.packets.cb.index;
    packet.cid = callback_index;
    // stores the callback in socket decorated packet properties
    ipc_client.packets.cb[callback_index] = callback;
  }
  // setting packet info
  packet.protocol = protocol;
  packet.data = data;
  //packet.destination = destination;

  // dispatching packet throughout destination connection with compression/encoding
  ipc_client.send(packet);

  // logging
  if (platform.configuration.debug.ipc === true){
    if (packet.cid != null) {
      console.debug('ipc packet sent to node %s for protocol %s with callback id %s', ipc_client.id, protocol, packet.cid);
    } else {
      console.debug('ipc packet sent to node %s for protocol %s', ipc_client.id, protocol);
    }
  }
};

/**
 * Contains IPC destination helper methods.
 * @type {Object}
*/
platform.cluster.ipc.destinations = platform.cluster.ipc.destinations || {};

platform.cluster.ipc.destinations.resolve = function(filter){
  var result = [];
  // detecting array of filters
  if (filter.constructor === Array) {
    Object.keys(platform.cluster.ipc.connections).forEach(function (id) {
      // applying filters
      var matches = false;
      filter.forEach(function(filter_child){
        if (filter_child === '!') {
          filter_child = '!' + platform.cluster.worker.id;
        }
        if (native.match.mini(id,filter_child) === true) {
          matches = true;
        }
      });
      if (matches === true) {
        if (result.indexOf(id) === -1) {
          result.push(id);
        }
      }
    });
  } else {
    if (filter === '!') {
      filter = '!' + platform.cluster.worker.id;
    }
    Object.keys(platform.cluster.ipc.connections).forEach(function (id) {
      if (native.match.mini(id, filter) === true) {
        result.push(id);
      }
    });
  }
  return result;
};

platform.cluster.ipc.destinations.list = function(role){
  var result = [];
  Object.keys(platform.cluster.ipc.connections).forEach(function(id){
    var connection = platform.cluster.ipc.connections[id];
    if (role == null || connection.role === role){
      result.push(id);
    }
  });
  return result;
};

platform.cluster.ipc.destinations.exists = function(id){
  return (Object.keys(platform.cluster.ipc.connections).indexOf(id) !== -1);
};

/**
 * Contains current worker IPC objects.
 * @type {Object}
*/
platform.cluster.worker.ipc = platform.cluster.worker.ipc || {};

/**
 *  Stores the current worker IPC socket server.
*/
platform.cluster.worker.ipc.server = platform.cluster.worker.ipc.server || {};

platform.cluster.ipc.connect = function(destination,callback){
  var transport = destination.substr(0,destination.indexOf(':'));
  var address = destination.substr(destination.indexOf(':')+3);
  var ipc_client = platform.cluster.ipc.socket.create(transport);
  switch (transport){
    case 'unix':
      ipc_client.connect(platform.io.map('/tmp/ipc/sockets/'+address));
      break;
    case 'tcp':
      var host = address.substr(0,address.lastIndexOf(':'));
      var port = address.substr(address.lastIndexOf(':')+1);
      ipc_client.connect(port,host);
      break;
    default:
      throw new Exception('ipc connection not supported for transport %s',transport);
      break;
  }

  return platform.events.wait('cluster.ipc.handshake',function(id,uri,client){
    if (uri === destination){
      return true;
    }
    return false;
  },callback);
};

platform.cluster.ipc.remote = platform.cluster.ipc.remote || {};
platform.cluster.ipc.remote.connect = function(destinations,destination,callback){
  return platform.cluster.ipc.sendAwait(destinations,'cluster.connect',{
    'destination': destination
  },callback);
};

platform.cluster.ipc.protocols.register('cluster.connect',function(client,data,callback){
  // packet specification
  // {}.destination

  //TODO: check if connection already exists (connected) and replace property is true
  var destination = data.destination;
  var transport = destination.substr(0,destination.indexOf(':'));
  var address = destination.substr(destination.indexOf(':')+3);
  switch (transport){
    case 'unix':
      var path = platform.io.map('/tmp/ipc/sockets/'+address);
      platform.io.backends.system.exists(path,function(exists){
        if (exists === true){
          platform.io.backends.system.info(path,function(err,stats){
            if (stats.isSocket() === true) {
              // connecting to cluster node
              if (platform.cluster.ipc.connections.hasOwnProperty(address) === false) {
                platform.cluster.ipc.connect(destination, callback);
              } else {
                if (callback != null) {
                  callback(new Exception('ipc unable to connect to %s: already connected', path));
                }
                // logging
                if (platform.configuration.debug.ipc === true){
                  console.warn('ipc unable to connect to %s: already connected',path);
                }
              }
            } else {
              if (callback != null){
                // sending error if unix socket is invalid
                callback(new Exception('ipc unable to connect to %s: path is not a socket',path));
              }
              // logging
              if (platform.configuration.debug.ipc === true){
                console.warn('ipc unable to connect to %s: path is not a socket',path);
              }
            }
          });
        } else {
          if (callback != null){
            // sending error if unix socket is invalid
            callback(new Exception('ipc unable to connect to %s: socket does not exists',path));
          }
          // logging
          if (platform.configuration.debug.ipc === true){
            console.warn('ipc unable to connect to %s: socket does not exists',path);
          }
        }
      });
      break;
    case 'tcp':
      // connecting to cluster node
      if (platform.cluster.ipc.connections.hasOwnProperty(address) === false) {
        platform.cluster.ipc.connect(destination, callback);
      } else {
        if (callback != null) {
          callback(new Exception('ipc unable to connect to %s: already connected', address));
        }
        // logging
        if (platform.configuration.debug.ipc === true){
          console.warn('ipc unable to connect to %s: already connected',address);
        }
      }
      break;
    default:
      if (callback != null){
        // sending error if unix socket is invalid
        callback(new Exception('ipc connection not supported for transport %s',transport));
      }
      // logging
      if (platform.configuration.debug.ipc === true){
        console.warn('ipc connection not supported for transport %s',transport);
      }
      break;
  }

},true);

platform.events.register('cluster.ipc.handshake',null,null,true);

// registering core.ipc.packet global class
platform.classes.register('core.ipc.packet',function(protocol,data){
  this.protocol = protocol;
  this.data = data;
  //this.destination = null;
  this.cid = null;
},true);

var EncoderPSON = function() {
  this._encoder = new native.compression.pson.ProgressivePair([]);
};
EncoderPSON.prototype.encode = function (data) {
  return this._encoder.encode(data).toBuffer();
};
EncoderPSON.prototype.decode = function (data) {
  return this._encoder.decode(data);
};

platform.classes.register('core.ipc.encoder.pson', EncoderPSON, true);

if (platform.state === platform._states.PRELOAD){

  platform.events.attachBefore('core.init','ipc.init','cluster.init',function(){
    // initializing IPC server
    platform.cluster.ipc._init();
    // starting IPC server
    platform.cluster.ipc.start();
    if (platform.cluster.worker.master === false) {
      // connecting to master if we're forked nodes (the master IPC server unix socket path is passed during bootstrap as ENV variable)
      platform.cluster.ipc.connect(process.env.CLUSTER_MASTER_URI);
    }
  });

}
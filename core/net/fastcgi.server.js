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

//T: implement FCGI_EndRequestBody, FCGI_UnknownTypeBody, FCGI_UnknownTypeBody, FCGI_KEEP_CONN, FCGI_GET_VALUES, FCGI_GET_VALUES_RESULT
//T: specification here: http://www.fastcgi.com/devkit/doc/fcgi-spec.html

platform.net = platform.net || {};

platform.net.fastcgi = platform.net.fastcgi || {};

platform.net.fastcgi.header_length = 8;
platform.net.fastcgi.max_payload_length = 8192;

platform.net.fastcgi.record_types = {
  'BEGIN_REQUEST': 1,
  'ABORT_REQUEST': 2,
  'END_REQUEST': 3,
  'PARAMS': 4,
  'STDIN': 5,
  'STDOUT': 6,
  'STDERR': 7,
  'DATA': 8,
  'GET_VALUES': 9,
  'GET_VALUES_RESULT': 10,
  'UNKNOWN_TYPE': 11
};

platform.net.fastcgi.roles = {
  'RESPONDER': 1,
  'AUTHORIZER': 2,
  'FILTER': 3
};

platform.net.fastcgi.new = {};

platform.net.fastcgi.new.header = function(record_type, request_id, content_length, padding_length){
  var result = {};
  result.version = 1;
  result.type = record_type;
  result.request_id_b1 = ((request_id >> 8) & 0xff);
  result.request_id_b0 = (request_id & 0xff);
  result.content_length_b1 = ((content_length >> 8) & 0xff);
  result.content_length_b0 = ((content_length) & 0xff);
  result.padding_length = padding_length;
  result.reserved = 0;
  return result;
};

platform.net.fastcgi.new.begin_request_body = function(role, flag) {
  var result = {};
  result.role_b1 = ((role >> 8) & 0xff);
  result.role_b0 = (role & 0xff);
  result.flag = flag;
  result.reserved_1 = 0;
  result.reserved_2 = 0;
  result.reserved_3 = 0;
  result.reserved_4 = 0;
  result.reserved_5 = 0;
  return result;
};

platform.net.fastcgi.get = {};

platform.net.fastcgi.get.request_idFromHeader = function(header){
  return (((header.request_id_b1 << 8) & (0xFF00)) | header.request_id_b0);
};

platform.net.fastcgi.get.content_lengthFromHeader = function(header){
  return (((header.content_length_b1 << 8) & (0xFF00)) | header.content_length_b0);
};

platform.net.fastcgi.get.RoleFromBeginRequest = function(begin_request){
  return (((begin_request.role_b1 << 8) & (0xFF00)) | begin_request.role_b0);
}

platform.net.fastcgi.get.header = function(chunk){
  var header = platform.net.fastcgi.new.header(0,0,0,0);

  header.version = chunk[0];
  header.type = chunk[1];
  header.request_id_b1 = chunk[2];
  header.request_id_b0 = chunk[3];
  header.content_length_b1 = chunk[4];
  header.content_length_b0 = chunk[5];
  header.padding_length = chunk[6];
  header.reserved = chunk[7];

  return header;
};

platform.net.fastcgi.send = {};

platform.net.fastcgi.send.begin_request = function(socket, request_id, role, flag){
  //C: creating header
  var begin_request_header = platform.net.fastcgi.new.header(platform.net.fastcgi.record_types.BEGIN_REQUEST, request_id, platform.net.fastcgi.header_length, 0);
  //C: creating payload
  var begin_request_body = platform.net.fastcgi.new.begin_request_body(role, flag);
  //C: adding header to list to be sent
  var begin_request = new Buffer(16);
  begin_request[0] = begin_request_header.version;
  begin_request[1] = begin_request_header.type;
  begin_request[2] = begin_request_header.request_id_b1;
  begin_request[3] = begin_request_header.request_id_b0;
  begin_request[4] = begin_request_header.content_length_b1;
  begin_request[5] = begin_request_header.content_length_b0;
  begin_request[6] = begin_request_header.padding_length;
  begin_request[7] = begin_request_header.reserved;
  //C: adding payload to list to be sent
  begin_request[8] = begin_request_body.role_b1;
  begin_request[9] = begin_request_body.role_b0;
  begin_request[10] = begin_request_body.flag;
  begin_request[11] = begin_request_body.reserved_1;
  begin_request[12] = begin_request_body.reserved_2;
  begin_request[13] = begin_request_body.reserved_3;
  begin_request[14] = begin_request_body.reserved_4;
  begin_request[15] = begin_request_body.reserved_5;
  //C: sending packets
  socket.write(begin_request);
};

platform.net.fastcgi.send.params = function(socket, request_id, params){
  var params_buffer = [];
  Object.keys(params).forEach(function(name){
    var value = params[name];
    //C: getting bytes of name to be sent
    var name_buffer = new Buffer (name);
    if (name_buffer.length <= 0x7F) {
      params_buffer.push (name_buffer.length);
    } else {
      params_buffer.push ((name_buffer.length >> 24) | 0x80);
      params_buffer.push (name_buffer.length >> 16);
      params_buffer.push (name_buffer.length >> 8);
      params_buffer.push (name_buffer.length);
    }
    if (value == null)
      value = '';
    //C: getting bytes of value to be sent
    var value_buffer = new Buffer (value);
    if (value_buffer.length <= 0x7F) {
      params_buffer.push (value_buffer.length);
    } else {
      params_buffer.push ((value_buffer.length >> 24) | 0x80);
      params_buffer.push (value_buffer.length >> 16);
      params_buffer.push (value_buffer.length >> 8);
      params_buffer.push (value_buffer.length);
    }
    //C: creating payload
    for (var count = 0; count < name_buffer.length; count++){
      params_buffer.push (name_buffer[count]);
    }
    for (var count = 0; count < value_buffer.length; count++){
      params_buffer.push (value_buffer[count]);
    }

  });
  //C: creating header
  var params_header = platform.net.fastcgi.new.header(platform.net.fastcgi.record_types.PARAMS, request_id, params_buffer.length, 0);
  var params_header_empty = platform.net.fastcgi.new.header(platform.net.fastcgi.record_types.PARAMS, request_id, 0, 0);
  //C: adding header to list to be sent
  var params_request = new Buffer(params_buffer.length+16);
  params_request[0] = params_header.version;
  params_request[1] = params_header.type;
  params_request[2] = params_header.request_id_b1;
  params_request[3] = params_header.request_id_b0;
  params_request[4] = params_header.content_length_b1;
  params_request[5] = params_header.content_length_b0;
  params_request[6] = params_header.padding_length;
  params_request[7] = params_header.reserved;
  //C: adding payload to list to be sent
  (new Buffer(params_buffer)).copy(params_request,8);
  //C: adding empty header to list to be sent
  params_request[-8] = params_header_empty.version;
  params_request[-7] = params_header_empty.type;
  params_request[-6] = params_header_empty.request_id_b1;
  params_request[-5] = params_header_empty.request_id_b0;
  params_request[-4] = params_header_empty.content_length_b1;
  params_request[-3] = params_header_empty.content_length_b0;
  params_request[-2] = params_header_empty.padding_length;
  params_request[-1] = params_header_empty.reserved;
  //C: sending packets
  socket.write(params_request);
};

platform.net.fastcgi.send.param = function(socket, request_id, name, value){
  var param_buffer = [];
  //C: getting bytes of name to be sent
  var name_buffer = new Buffer (name);
  if (name_buffer.length <= 0x7F) {
    param_buffer.push (name_buffer.length);
  } else {
    param_buffer.push ((name_buffer.length >> 24) | 0x80);
    param_buffer.push (name_buffer.length >> 16);
    param_buffer.push (name_buffer.length >> 8);
    param_buffer.push (name_buffer.length);
  }
  if (value == null)
    value = '';
  //C: getting bytes of value to be sent
  var value_buffer = new Buffer (value);
  if (value_buffer.length <= 0x7F) {
    param_buffer.push (value_buffer.length);
  } else {
    param_buffer.push ((value_buffer.length >> 24) | 0x80);
    param_buffer.push (value_buffer.length >> 16);
    param_buffer.push (value_buffer.length >> 8);
    param_buffer.push (value_buffer.length);
  }
  //C: creating payload
  for (var count = 0; count < name_buffer.length; count++){
    param_buffer.push (name_buffer[count]);
  }
  for (var count = 0; count < value_buffer.length; count++){
    param_buffer.push (value_buffer[count]);
  }

  //C: creating header
  var param_header = platform.net.fastcgi.new.header(platform.net.fastcgi.record_types.PARAMS, request_id, param_buffer.length, 0);
  //C: adding header to list to be sent
  var param_request = new Buffer(param_buffer.length+8);
  param_request[0] = param_header.version;
  param_request[1] = param_header.type;
  param_request[2] = param_header.request_id_b1;
  param_request[3] = param_header.request_id_b0;
  param_request[4] = param_header.content_length_b1;
  param_request[5] = param_header.content_length_b0;
  param_request[6] = param_header.padding_length;
  param_request[7] = param_header.reserved;
  //C: adding payload to list to be sent
  (new Buffer(param_buffer)).copy(param_request,8);
  //C: sending packets
  socket.write(param_request);
}

platform.net.fastcgi.send.params_empty = function(socket, request_id){
  //C: creating header
  var params_header = platform.net.fastcgi.new.header(platform.net.fastcgi.record_types.PARAMS, request_id, 0, 0);
  //C: adding header to list to be sent
  var params_request = new Buffer(8);
  params_request[0] = params_header.version;
  params_request[1] = params_header.type;
  params_request[2] = params_header.request_id_b1;
  params_request[3] = params_header.request_id_b0;
  params_request[4] = params_header.content_length_b1;
  params_request[5] = params_header.content_length_b0;
  params_request[6] = params_header.padding_length;
  params_request[7] = params_header.reserved;
  //C: sending packets
  socket.write(params_request);
};

platform.net.fastcgi.send.stdin = function(socket, request_id, chunk){
  var stdin_request = null;
  //C: getting number of full packets to be sent
  var full_packets_count = Math.floor(chunk.length / platform.net.fastcgi.max_payload_length);
  //C: getting last packet size
  var last_packet_size = chunk.length - (full_packets_count * platform.net.fastcgi.max_payload_length);
  if (chunk.length > 0) {
    //C: creating full packets
    for (var count = 0; count < full_packets_count; count++) {
      //C: creating header
      var stdin_header = platform.net.fastcgi.new.header (platform.net.fastcgi.record_types.STDIN, request_id, platform.net.fastcgi.max_payload_length, 0);
      //C: adding header to list to be sent
      stdin_request = new Buffer(platform.net.fastcgi.max_payload_length+8);
      stdin_request[0] = stdin_header.version;
      stdin_request[1] = stdin_header.type;
      stdin_request[2] = stdin_header.request_id_b1;
      stdin_request[3] = stdin_header.request_id_b0;
      stdin_request[4] = stdin_header.content_length_b1;
      stdin_request[5] = stdin_header.content_length_b0;
      stdin_request[6] = stdin_header.padding_length;
      stdin_request[7] = stdin_header.reserved;
      //C: adding payload to list to be sent
      chunk.copy(stdin_request,8,count * platform.net.fastcgi.max_payload_length, (count * platform.net.fastcgi.max_payload_length)+platform.net.fastcgi.max_payload_length);
      //C: sending packets
      socket.write(stdin_request);
    }
    //C: creating last packet
    if (last_packet_size > 0) {
      var stdin_header = platform.net.fastcgi.new.header (platform.net.fastcgi.record_types.STDIN, request_id, platform.net.fastcgi.max_payload_length, 0);
      //C: adding header to list to be sent
      stdin_request = new Buffer(last_packet_size+8);
      stdin_request[0] = stdin_header.version;
      stdin_request[1] = stdin_header.type;
      stdin_request[2] = stdin_header.request_id_b1;
      stdin_request[3] = stdin_header.request_id_b0;
      stdin_request[4] = stdin_header.content_length_b1;
      stdin_request[5] = stdin_header.content_length_b0;
      stdin_request[6] = stdin_header.padding_length;
      stdin_request[7] = stdin_header.reserved;
      //C: adding payload to list to be sent
      chunk.copy(stdin_request,8,count * platform.net.fastcgi.max_payload_length, (count * platform.net.fastcgi.max_payload_length)+last_packet_size);
      //C: sending packets
      socket.write(stdin_request);
    }
  }
};

platform.net.fastcgi.send.stdin_empty = function(socket, request_id) {
  var stdin_header = platform.net.fastcgi.new.header (platform.net.fastcgi.record_types.STDIN, request_id, 0, 0);
  //C: adding header to list to be sent
  var stdin_request = new Buffer(8);
  stdin_request[0] = stdin_header.version;
  stdin_request[1] = stdin_header.type;
  stdin_request[2] = stdin_header.request_id_b1;
  stdin_request[3] = stdin_header.request_id_b0;
  stdin_request[4] = stdin_header.content_length_b1;
  stdin_request[5] = stdin_header.content_length_b0;
  stdin_request[6] = stdin_header.padding_length;
  stdin_request[7] = stdin_header.reserved;
  //C: sending packets
  socket.write(stdin_request);
};


var fastcgi_client = function(port_or_socket, host){

  var count_for_id = 0;

  this.request = function(options, callback){
    var response = native.stream.Readable();
    var request = native.stream.Writable();
    var source = null;

    if (count_for_id === Number.MAX_VALUE) {
      count_for_id = 0;
    }
    response.id = ++count_for_id;

    if (typeof port_or_socket === 'number') {
      response._socket = native.net.connect(port_or_socket,host||'localhost');
    } else if (typeof port_or_socket === 'string') {
      response._socket = native.net.connect(platform.io.map(port_or_socket));
    } else {
      throw new Exception('wrong parameters to create fastcgi client socket', port_or_socket, host);
    }
    response._socket.setNoDelay();

    response.statusCode = 200;
    response.headers = {};

    response._socket.on('connect',function() {
      if (platform.configuration.server.debugging.fastcgi === true){
        console.debug('connected client for fastcgi request #%s',response.id);
      }

      platform.net.fastcgi.send.begin_request(response._socket, response.id, platform.net.fastcgi.roles.RESPONDER, 0);

      if (platform.configuration.server.debugging.fastcgi === true){
        console.debug('sending begin for fastcgi request #%s',response.id);
      }

      var params = {};
      params['GATEWAY_INTERFACE'] = 'CGI/1.1';
      params['SERVER_SOFTWARE'] = 'ljve.io/0.4.0';
      params['QUERY_STRING'] = options.query;
      params['REQUEST_METHOD'] = options.method;
      params['CONTENT_TYPE'] = options.headers['content-type'];
      params['CONTENT_LENGTH'] = options.headers['content-length'];
      params['SCRIPT_FILENAME'] = native.path.join(platform.runtime.path.app,options.path);
      params['SCRIPT_NAME'] = native.path.basename(options.path);
      params['REQUEST_URI'] = options.path;
      params['DOCUMENT_URI'] = options.path;
      params['DOCUMENT_ROOT'] = platform.runtime.path.app;
      params['SERVER_PROTOCOL'] = 'HTTP/1.0';
      params['REMOTE_ADDR'] = context.request.client.address;
      params['REMOTE_PORT'] = context.request.client.port;
      params['SERVER_ADDR'] = '127.0.0.1';
      params['SERVER_PORT'] = context.server.port;
      params['SERVER_NAME'] = 'localhost';
      params['HTTP_HOST'] = params['SERVER_NAME'] + ':' + params['SERVER_PORT'];
      Object.keys(options.headers).forEach(function(key){
        params['HTTP_' + key.toUpperCase().replace(/-/gi,'_')] = options.headers[key];
      });

      Object.keys(params).forEach(function(key){
        platform.net.fastcgi.send.param(response._socket,response.id,key,params[key]);
      });

      //platform.net.fastcgi.send.params(response._socket, response.id, params);

      if (platform.configuration.server.debugging.fastcgi === true){
        console.debug('sending params for fastcgi request #%s',response.id);
      }

      if (options.headers['content-length'] == null || options.headers['content-length'] === 0){
        if (platform.configuration.server.debugging.fastcgi === true){
          console.debug('sending end stdin for fastcgi request #%s',response.id);
        }
        platform.net.fastcgi.send.stdin_empty(response._socket, response.id);
      } else {
        var source_length = 0;
        source.on('data', function (chunk) {
          if (platform.configuration.server.debugging.fastcgi === true){
            console.debug('sending stdin chunk for fastcgi request #%s (added %s, total %s)',response.id,chunk.length,source_length);
          }
          source_length = +chunk.length;
          platform.net.fastcgi.send.stdin(response._socket,response.id,chunk);
        });
        source.on('end', function () {
          if (options.headers['content-length'] != null && source_length != options.headers['content-length']) {
            if (platform.configuration.server.debugging.fastcgi === true) {
              console.debug('sending updated stdin content length for fastcgi request #%s', response.id);
            }
            platform.net.fastcgi.send.param(response._socket, response.id, 'CONTENT_LENGTH', source_length);
            platform.net.fastcgi.send.params_empty(response._socket, response.id);
          }
          if (platform.configuration.server.debugging.fastcgi === true){
            console.debug('sending end stdin for fastcgi request #%s',response.id);
          }
          platform.net.fastcgi.send.stdin_empty(response._socket, response.id);
        });
        if (source != null) {
          source.resume();
        }
      }
    });

    var header = null;
    var chunk_buffer = [];
    var head_buffer = [];
    var content = false;
    var content_length = 0;
    var padding = 0;
    var queue = false;
    var queue_chunk = null;
    var payload_remaining = 0;

    var process_data = function(chunk) {
      if (platform.configuration.server.debugging.fastcgi === true){
        console.debug('received chunk of %s bytes for fastcgi request #%s',chunk.length,response.id);
      }
      if (header == null) {
        chunk_buffer = [];
        head_buffer = [];
        if (padding > 0){
          if (chunk.length <= padding){
            padding -= chunk.length;
            return;
          } else {
            chunk = chunk.slice(padding);
            padding = 0;
          }
        }
        header = platform.net.fastcgi.get.header(chunk);
        //C: checking protocol version and packet type
        if (header.type < 1 || header.version < 1) {
          request.emit('error', new Exception('unsupported fastcgi protocol %s packet type %s',header.version,header.type));
        }
        //C: getting content size
        payload_remaining = platform.net.fastcgi.get.content_lengthFromHeader(header);
        if (platform.configuration.server.debugging.fastcgi === true){
          console.debug('received header type %s for fastcgi request #%s with payload %s and padding %s',header.type,response.id,payload_remaining,header.padding_length);
        }
        chunk = chunk.slice(8);
        //C: ignoring padding bytes
        padding = header.padding_length;
      }
      if (payload_remaining > 0) {
        if (chunk.length <= payload_remaining) {
          chunk_buffer.push(chunk);
          payload_remaining -= chunk.length;
        } else {
          chunk_buffer.push(chunk.slice(0, payload_remaining));
          queue_chunk = chunk.slice(payload_remaining);
          payload_remaining = 0;
          queue = true;
        }
      }
      //C: switching on received type header
      switch (header.type) {
        case platform.net.fastcgi.record_types.STDOUT:
          if (content === false) {
            if (platform.configuration.server.debugging.fastcgi === true){
              console.debug('looking for response headers for fastcgi request #%s',response.id);
            }
            var last_chunk = chunk_buffer[0];
            chunk_buffer.shift();
            for (var count = 0; count < last_chunk.length; count++) {
              var current_byte = last_chunk[count];
              head_buffer.push(current_byte);
              if (current_byte === 10 && head_buffer.length > 1 && head_buffer[head_buffer.length-2] === 13) {
                head_buffer.pop();
                head_buffer.pop();
                var line = (new Buffer(head_buffer)).toString();
                head_buffer = [];
                if (line === '') {
                  if (platform.configuration.server.debugging.fastcgi === true){
                    console.debug('finished headers for fastcgi request #%s',response.id);
                  }
                  content = true;
                  chunk = last_chunk.slice(count);
                  request.emit('response', response);
                  break;
                } else {
                  var colon_position = line.indexOf(': ');
                  if (colon_position !== -1) {
                    var header_name = line.substr(0, colon_position).toLowerCase();
                    var header_value = line.substr(colon_position + 2);
                    if (platform.configuration.server.debugging.fastcgi === true){
                      console.debug('found header %s for fastcgi request #%s: %s',header_name,response.id, header_value);
                    }
                    if (header_name === 'status') {
                      response.statusCode = parseInt(header_value.split(' ')[0]);
                    } else {
                      response.headers[header_name] = header_value;
                    }
                  }
                }
              }
            }
          }
          if (content === true) {
            content_length += chunk.length;
            if (platform.configuration.server.debugging.fastcgi === true){
              console.debug('fetching response content for fastcgi request #%s (added %s, total %s)',response.id,chunk.length,content_length);
            }
            response.emit('data', chunk);
          }
          break;
        case platform.net.fastcgi.record_types.END_REQUEST:
          if (response.headers['content-length'] != null && content_length !== response.headers['content-length']) {
            request.emit('error', new Exception('expected content length %s but received %s',response.headers['content-length'],content_length));
          }
          content = false;
          content_length = 0;
          response.emit('end');
          response._socket.destroy();
          break;
        case platform.net.fastcgi.record_types.STDERR:
          if (payload_remaining === 0) {
            request.emit('error', new Exception(Buffer.concat(chunk_buffer).toString().replace(/\n$/gi,'')));
          }
          break;
        default:
          if (payload_remaining === 0) {
            request.emit('error', new Exception('unsupported fastcgi packet type %s', header.type));
          }
          break;
      }
      if (payload_remaining === 0) {
        header = null;
      }
      if(queue === true){
        queue = false;
        process_data(queue_chunk);
      }
    };

    response._socket.on('data',process_data);

    response._socket.on('end',function(){
      request.emit('end');
    });

    response._socket.on('timeout',function(){
      response.statusCode = 502;
      request.emit('response', response);
      var response_buffer = new Buffer(response.statusCode + ' timeout');
      response.emit('data', response_buffer);
      response.emit('end');
      response._socket.destroy();
    });

    response._socket.on('error',function(err){
      request.emit('error', err);
      response._socket.destroy();
    });

    response._socket.on('close',function(){
      response.emit('close');
    });

    request.on('pipe',function(src){
      source = src;
      source.pause();
    });

    response._read = function(size){
      response.push(null);
    };

    request._write = function (chunk, enc, next) {
      //H: attached to data event
    };

    return request;
  };

};


//C: registering 'core.io.store.file' to global classes
platform.classes.register('core.net.fastcgi.client',fastcgi_client,true);
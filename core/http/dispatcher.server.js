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

//T: complete port of multihost support from 0.3.x branch

//N: Provides server-side specific classes and namespaces.
platform.server = platform.server || {};

//N: Provides host dispatcher objects and methods.
platform.server.dispatcher = platform.server.dispatcher || {};

//V: Stores whether multihost mode is enabled.
platform.server.dispatcher.multihost = false;

//V: Stores the host engines for site/service provisioning.
platform.server.dispatcher._providers = {};

//V: Stores the host appdomains for site/service provisioning.
platform.server.dispatcher._resolvemap = {};

//F: Initializes host dispatcher and host providers.
platform.server.dispatcher.init = function(){

};

//F: Deinitializes host dispatcher and host providers.
platform.server.dispatcher.deinit = function(){

};

//F: Creates an host provider.
//A: host: Specifies the name of the provided by the new provider.
//A: path: Specifies the root path for the new provider.
platform.server.dispatcher.create = function(host,path){

};

//O: Provides process implementations.
platform.server.dispatcher.process = {};

//F: Processes an HTTP request.
//A: request: Specifies the request object to be processed.
//A: response: Specifies the response object to be processed.
platform.server.dispatcher.process.http = function(request, response){

};

//F: Processes a new WebSocket.
//A: headers: Specifies the request object to be processed.
//A: websocket: Specifies the socket object to be processed.
platform.server.dispatcher.process.websocket = function(headers, websocket){

};

//F: Retrieves or creates host provider by hostname.
//A: host: Specifies the hostname to be resolved.
platform.server.dispatcher.resolve = function(host){

};
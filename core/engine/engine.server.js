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
platform.engine = platform.engine || {};

//O: Provides process implementations.
platform.engine.process = {};

//F: Processes an HTTP request.
//A: context: Specifies the context object to be processed.
platform.engine.process.http = function (context) {
  context.response.end();
};

//F: Processes a new WebSocket.
//A: headers: Specifies the request object to be processed.
//A: websocket: Specifies the socket object to be processed.
platform.engine.process.websocket = function (headers, websocket) {
  websocket.close();
};
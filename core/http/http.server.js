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

//C: loading express http server and initializing it
platform.server = platform.server || {};
platform.server.http = platform.server.http || {};
platform.server.http[8080] = require('http').createServer();

platform.server.http[8080].on('request',function(request, response){
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('I\'m aljve.');
});

platform.server.http[8080].listen(8080);
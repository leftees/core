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
platform.engine = platform.engine || {};

platform.engine.send = platform.engine.send || {};

platform.engine.send.cache = function(path,tag){
  if (platform.io.cache.isCachedSync(path,tag) === true) {
    var request = context.request;
    var response = context.response;
    var server = context.server;

    //TODO: get last-modified/content-length for header

    var content_type = platform.configuration.server.http.default.mimetypes[native.path.extname(path)] || 'text/plain';
    response.setHeader("Content-Type", content_type);
    response._async = true;

    var data_stream = null;
    if (server.compression.enable === true && request.headers ['accept-encoding'] != null && request.headers ['accept-encoding'].includes('gzip') === true) {
      response.setHeader('Content-Encoding', 'gzip');
      data_stream = platform.io.cache.get.streamSync(path, tag, false);
    } else {
      data_stream = platform.io.cache.get.streamSync(path, tag, true);
    }
    if (request.method === 'HEAD') {
      response.end();
    } else {
      data_stream.pipe(response);
    }
  } else {
    //TODO: throw error?
  }
};
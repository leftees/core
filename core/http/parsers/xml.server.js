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

// registering body parser for text/xml (uses libxmljs node module)
platform.server.http.context.parsers.register('application/xml',function(request,callback){
  // executing external module body with content size limit
  native.body.text(request,null,{
    limit: request.limit
  },function(err,data){
    if (err) {
      callback(err);
      return;
    }
    try {
      // invoking callback with XMLDocument-related object as result
      callback(null,native.dom.xml(data));
    }catch(err){
      callback(err,data);
    }
  });
});
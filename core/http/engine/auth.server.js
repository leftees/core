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
platform.engine = platform.engine|| {};

/**
 * Provides process implementations.
 * @type {Object}
*/
platform.engine.process = platform.engine.process|| {};

/**
 * Provides auth implementations.
 * @type {Object}
*/
platform.engine.process.auth = platform.engine.process.auth || {};

platform.engine.process.auth.basic = function(realm,username,password,callback){
  //TODO: integrate with user system
  callback(password === 'password');
};

platform.engine.process.auth.digest = function(realm,username,callback){
  var md5 = native.crypto.createHash('md5');
  //TODO: integrate with user system
  md5.update(username + ':' + realm + ':' + 'password');
  var digest = md5.digest('hex');
  callback(digest);
};
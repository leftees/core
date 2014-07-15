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

//N: Contains platform configuration.
platform.configuration = {};

//O: Contains general application info.
platform.configuration.application = {
  "name": "Novetica Ljve",
  "version": "0.4",
  "domain": "localhost"
};

//N: Contains server configuration.
platform.configuration.server = {};

//N: Contains bootloader configuration (server-side).
platform.configuration.server.bootloader = {};

//O: Contains Javascript core modules, as array, to be inject during bootstrap (these are not augmented).
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. "http://cdn.example.com/...").
platform.configuration.server.bootloader.preload = [
  'runtime.server.js',
  'dev/devtools.server.js',
  'kernel.server.js',
  'kernel/preprocess.server.js'
];

//O: Contains Javascript core modules, as array, to be inject after bootstrap to load application server (these are augmented).
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. "http://cdn.example.com/...").
platform.configuration.server.bootloader.modules = [
  'runtime.server.js',
  'dev/devtools.server.js',
  'kernel.server.js',
  'kernel/preprocess.server.js',
  'kernel/prototype.server.js',
  'kernel/classes.server.js',
  'kernel/io.server.js',
  'http/http.server.js'
];

//N: Contains kernel configuration (server-side).
platform.configuration.server.kernel = {};

//O: Contains Javascript preprocessor modules, as array, to be loaded to augment code.
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. "http://cdn.example.com/...").
platform.configuration.server.kernel.preprocessors = [
];

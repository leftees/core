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

//O: Contains server configuration.
platform.configuration.server = {};

//O: Contains bootloader configuration (server-side).
platform.configuration.server.bootloader = {};

//O: Contains Javascript core modules, as array, to be inject during bootstrap (these are not augmented).
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. "http://cdn.example.com/...").
platform.configuration.server.bootloader.preload = [
  'runtime.server.js',
  'utility.server.js',
  'dev/devtools.server.js',
  'kernel/kernel.server.js',
  'kernel/preprocess.server.js',
  'kernel/prototype.server.js',
  'kernel/classes.server.js',
  'io/backend/file.server.js',
  'io/store.server.js',
  'io/io.server.js',
  'io/cache.server.js',
];

//O: Contains Javascript core modules, as array, to be inject after bootstrap to load application server (these are augmented).
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. "http://cdn.example.com/...").
platform.configuration.server.bootloader.modules = [
  'runtime.server.js',
  'utility.server.js',
  'dev/devtools.server.js',
  'kernel/kernel.server.js',
  'kernel/preprocess.server.js',
  'kernel/prototype.server.js',
  'kernel/classes.server.js',
  'io/backend/file.server.js',
  'io/store.server.js',
  'io/io.server.js',
  'io/cache.server.js',
  'http/http.server.js'
];

//O: Contains kernel configuration (server-side).
platform.configuration.server.kernel = {};

//O: Contains Javascript preprocessor modules, as array, to be loaded to augment code.
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. "http://cdn.example.com/...").
platform.configuration.server.kernel.preprocessors = [
];

//O: Contains web server configuration.
platform.configuration.server.http = {};

//O: Contains HTTP and TLS port configurations.
//H: Multiple ports are supported through piped name, e.g. '8080\8081' activate both ports with same configuration.
platform.configuration.server.http.ports = {
    //V: Define port to be configured.
    '8080': {
      //V: Define standard unsecure HTTP server on specified ports.
      'secure': false
    },
    //V: Define port to be configured.
    '8443': {
      //V: Defines secure HTTPS server on specified ports.
      'secure': true,
      //V: Defines ciphers suite for TLS stack.
      'ciphers': 'HIGH !aNULL !eNULL !MEDIUM !LOW !3DES !MD5 !EXP !PSK !SRP !DSS',
      //V: Enable or disable specific secure protocol versions (SSLv2 is deprecated by default).
      'protocols': {
        'SSLv3': false,
        'TLSv10': true,
        'TLSv11': true,
        'TLSv12': true
      },
      //V: Specifies the absolute path to pfx file containing PEM certificate and private key.
      'pfx': null,
      //V: Specifies the passphrase to unwrap the private key in pfx file.
      'passphrase': null,
      //V: Specifies the absolute path to PEM certificate file.
      'cert': null,
      //V: Specifies the absolute path to certificate private key file.
      'key': null
    }
};

//T: support multiple backends by configuration
/*
//O: Contains IO and store configuration.
platform.configuration.server.io = {};

//O: Contains store specific configuration.
platform.configuration.server.io.store = platform.configuration.server.io.store || {};

//O: Contains multiple custom backends for IO multistore support.
//H: Priority '0' and name 'app' are reserved for backends.
platform.configuration.server.io.store.backends = {
  //V: Define custom backend name to be configured.
  'core-override':{
    //V: Define backend class (it should be registered through platform.classes methods).
    'class': '',
    //V: Define backend class constructor parameters as array (see platform.kernel.new).
    'params': [],
    //V: Define backend target priority.
    'priority': 1
  }
};
*/
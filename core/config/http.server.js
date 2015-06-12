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

platform.configuration.server = platform.configuration.server || {};

/**
 * Contains web server configuration.
 * @type {Object}
*/
platform.configuration.server.http = {};

/**
 * Contains HTTP and TLS port configurations.
 * @type {Object}
 * @alert  Multiple ports are supported through piped name, e.g. '8080\8081' activate both ports with same configuration.
*/
platform.configuration.server.http.ports = {
  /**
   *  Define port to be configured.
  */
  '8080': {
    /**
     *  Define standard unsecure HTTP server on specified ports.
    */
    'secure': false,
    /**
     *  Enable or disable verbose HTTP debug log on specified ports (overrides defaults).
    */
    'debug': true,
    /**
     *  Define content body max byte size for requests on specified ports (overrides defaults).
    */
    'limit': 5000000,
    'timeout': 15000,
    'compression': {
      'enable': true,
      'limit': 1024
    },
    /**
     *  Define HTTP authorization type on specified ports: 'basic', 'digest' or false.
    */
    'auth': false,
    /**
     *  Define realm for HTTP authorization on specified ports.
    */
    'realm': '',
    /**
     *  Define port-specific regexp to reject request by URI (overrides defaults).
     * @alert  Filter is applied against request relative URI cleaned by querystring.
    */
    'reject': {
      'url': /^\/LICENSE|^\/README|\/\.|\.exe$|\.dll$|\.class$|\.jar$|\.server\.js$|\.json$|^\/bin\/|^\/build\/|^\/cache\/|^\/core\/|^\/data\/|^\/external\/|^\/log\/|^\/node_modules\/|\/^\/project\/|^\/stats\/|^\/test\/|^\/tmp\/|^\/tools\//
    },
    /**
     *  Contains port-specific HTTP redirect configuration.
     * @alert  Filters are applied against request relative URI cleaned by querystring.
    */
    'redirect':{
       /**
        *  Define new redirector name.
       */
       //'myredirectbystring': {
       /**
        *  Define string to be searched into URL as string.
       */
       //'filter': '/example',
       /**
        *  Define new URI to redirect to, as string.
       */
       //'to': 'http://example.com/ljve/8080/'
       //}
     }
  },
  /**
   *  Define port to be configured.
  */
  '8443': {
    /**
     *  Enable or disable secure TLS on specified ports.
    */
    'secure': true,
    /**
     *  Enable or disable verbose HTTP debug log on specified ports (overrides defaults).
    */
    'debug': true,
    /**
     *  Define content body max byte size for requests on specified ports (overrides defaults).
    */
    'limit': 5000000,
    'timeout': 15000,
    'compression': {
      'enable': true,
      'limit': 1024
    },
    /**
     *  Define HTTP authorization type on specified ports: 'basic', 'digest' or false.
    */
    'auth': false,
    /**
     *  Define realm for HTTP authorization on specified ports.
    */
    'realm': null,
    /**
     *  Contains port-specific HTTP redirect configuration.
     * @alert  Filters are applied against request relative URI cleaned by querystring.
    */
    'redirect':{
       /**
        *  Define new redirector name.
       */
       //'override_redirect_by_string': {
       /**
        *  Define string to be searched into URL as string.
       */
       //'filter': '/example',
       /**
        *  Define new URI to redirect to, as string.
       */
       //'to': 'http://example.com/ljve/8443/'
       //}
     },
    /**
     *  Defines ciphers suite for TLS stack.
    */
    'ciphers': 'HIGH !aNULL !eNULL !MEDIUM !LOW !3DES !MD5 !EXP !PSK !SRP !DSS',
    /**
     *  Enable or disable specific secure protocol versions (SSLv2 is deprecated by default).
    */
    'protocols': {
      'SSLv3': false,
      'TLSv10': true,
      'TLSv11': true,
      'TLSv12': true
    },
    /**
     *  Specifies the absolute path to pfx file containing PEM certificate and private key.
    */
    'pfx': null,
    /**
     *  Specifies the passphrase to unwrap the private key in pfx file.
    */
    'passphrase': null,
    /**
     *  Specifies the absolute path to PEM certificate file.
    */
    'cert': '/core/ssl/self.crt',
    /**
     *  Specifies the absolute path to certificate private key file.
    */
    'key': '/core/ssl/self.key'
  }
};

/**
 * Contains common defaults for web server configuration.
 * @type {Object}
*/
platform.configuration.server.http.default = {};

/**
 *  Define default content body max byte size for requests.
*/
platform.configuration.server.http.default.limit = 5000000;

platform.configuration.server.http.default.timeout = 15000;

platform.configuration.server.http.default.compression = {
  'enable': true,
  'limit': 1024
};

//TODO: improve with support for match multiple rules
/**
 * Contains common defaults for HTTP security.
 * @type {Object}
*/
platform.configuration.server.http.default.reject = {};
/**
 * Define default regexp to reject request by URI.
 * @alert  Filter is applied against request relative URI cleaned by querystring.
*/
platform.configuration.server.http.default.reject.url = /^\/LICENSE|^\/README|\/\.|\.exe$|\.dll$|\.class$|\.jar$|\.server\.js$|\.json$|^\/bin\/|^\/build\/|^\/cache\/|^\/core\/|^\/data\/|^\/external\/|^\/log\/|^\/node_modules\/|\/^\/project\/|^\/stats\/|^\/test\/|^\/tmp\/|^\/tools\//;

/**
 * Contains default HTTP redirect configuration.
 * @type {Object}
 * @alert  Filters are applied against request relative URI cleaned by querystring.
*/
platform.configuration.server.http.default.redirect = {
 /**
  *  Define new redirector name.
 */
 //'redirect_by_string': {
 /**
  *  Define string to be searched into URL as string.
 */
 //'filter': '/example',
 /**
  *  Define new URI to redirect to, as string.
 */
 //'to': 'http://example.com/ljve/'
 //},
 /**
  *  Define new redirector name.
 */
 //'redirect_by_regexp': {
 /**
  *  Define string to be searched into URL as regexp.
 */
 //'filter': /^\/examplex(.*)/,
 /**
  *  Define new URI to redirect to, as string but with regexp grouping support.
 */
 //'to': 'http://example.com/$1/'
 //},
 /**
  *  Define new redirector name.
 */
 //'redirect_by_function': {
 /**
  *  Define function to be called for custom tests.
 */
 //'filter': function(){
 //return false;
 //},
 /**
  *  Define new URI to redirect to, as string but with regexp grouping support.
 */
 //'to': 'http://example.com/$1/'
 //}
};

platform.configuration.server.http.contexts = {
  'cache': {
    'size': 200
  },
  'gc': {
    'force': false,
    'interval': 1000*60*1
  }
};
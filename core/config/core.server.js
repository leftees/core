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
  'name': 'Novetica Ljve',
  'version': '0.4.0-porting',
  'available': true
};

//O: Contains server configuration.
platform.configuration.server = {};

//O: Contains bootloader configuration (server-side).
platform.configuration.server.bootloader = {};

//O: Contains Javascript core modules, as array, to be inject during bootstrap (these are not augmented).
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. 'http://cdn.example.com/...').
platform.configuration.server.bootloader.preload = [
  'runtime.server.js',
  'stat.server.js',
  'utility.server.js',
  'kernel/kernel.server.js',
  'kernel/prototype.server.js',
  'kernel/classes.server.js',
  'io/backend/file.server.js',
  'io/store.server.js',
  'io/io.server.js',
  'io/cache.server.js',
  'parser/js.server.js',
  'kernel/preprocess.server.js',
  'kernel/preprocessors/code.blocking.server.js'
];

//O: Contains Javascript core modules, as array, to be inject after bootstrap to load application server (these are augmented).
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. 'http://cdn.example.com/...').
platform.configuration.server.bootloader.modules = [
  'runtime.server.js',
  'stat.server.js',
  'utility.server.js',
  'development/tools.server.js',
  'kernel/kernel.server.js',
  'kernel/prototype.server.js',
  'kernel/classes.server.js',
  'io/backend/file.server.js',
  'io/store.server.js',
  'io/io.server.js',
  'io/cache.server.js',
  'parser/js.server.js',
  'kernel/preprocess.server.js',
  'system/memory.server.js',
  'net/fastcgi.server.js',
  'engine/engine.server.js',
  'engine/handler.server.js',
  'client/bootstrap.server.js',
  'client/supported.server.js',
  'session/session.server.js',
  'session/session.store.server.js',
  'session/sgen.server.js',
  'session/pool.server.js',
  'session/pool.store.server.js',
  'messaging/mail/mail.server.js',
  'http/context.server.js',
  'http/http.server.js'
];

//O: Contains kernel configuration (server-side).
platform.configuration.server.kernel = {};

//O: Contains Javascript preprocessor modules, as array, to be loaded to augment code.
//H: This should include paths relative to core, app or system roots. Remote HTTP/HTTPS resources are supported (e.g. 'http://cdn.example.com/...').
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
      'secure': false,
      //V: Enable or disable verbose HTTP debug log on specified ports (overrides defaults).
      'debug': true,
      //V: Define content body max byte size for requests on specified ports (overrides defaults).
      'limit': 5000000,
      'timeout': 15000,
      'compression': {
        'enable': true,
        'limit': 1024
      },
      //V: Define HTTP authorization type on specified ports: 'basic', 'digest' or false.
      'auth': false,
      //V: Define realm for HTTP authorization on specified ports.
      'realm': null,
      //V: Define port-specific regexp to reject request by URI (overrides defaults).
      //H: Filter is applied against request relative URI cleaned by querystring.
      'reject': {
        'url': /^\/LICENSE|^\/README|\/\.|\.exe$|\.dll$|\.class$|\.jar$|\.server\.js$|\.json$|^\/bin\/|^\/build\/|^\/cache\/|^\/core\/|^\/data\/|^\/external\/|^\/log\/|^\/node_modules\/|\/^\/project\/|^\/stats\/|^\/test\/|^\/tmp\/|^\/tools\//
      },
      //V: Contains port-specific HTTP redirect configuration.
      //H: Filters are applied against request relative URI cleaned by querystring.
      'redirect':{
        //V: Define new redirector name.
        'myredirectbystring': {
          //V: Define string to be searched into URL as string.
          'filter': '/example',
          //V: Define new URI to redirect to, as string.
          'to': 'http://example.com/ljve/8080/'
        }
      }
    },
    //V: Define port to be configured.
    '8443': {
      //V: Enable or disable secure TLS on specified ports.
      'secure': true,
      //V: Enable or disable verbose HTTP debug log on specified ports (overrides defaults).
      'debug': true,
      //V: Define content body max byte size for requests on specified ports (overrides defaults).
      'limit': 5000000,
      'timeout': 15000,
      'compression': {
        'enable': true,
        'limit': 1024
      },
      //V: Define HTTP authorization type on specified ports: 'basic', 'digest' or false.
      'auth': false,
      //V: Define realm for HTTP authorization on specified ports.
      'realm': null,
      //V: Contains port-specific HTTP redirect configuration.
      //H: Filters are applied against request relative URI cleaned by querystring.
      'redirect':{
        //V: Define new redirector name.
        'override_redirect_by_string': {
          //V: Define string to be searched into URL as string.
          'filter': '/example',
          //V: Define new URI to redirect to, as string.
          'to': 'http://example.com/ljve/8443/'
        }
      },
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
      'cert': '/core/ssl/self.crt',
      //V: Specifies the absolute path to certificate private key file.
      'key': '/core/ssl/self.key'
    }
};

//O: Contains common defaults for web server configuration.
platform.configuration.server.http.default = {};

//V: Define default content body max byte size for requests.
platform.configuration.server.http.default.limit = 5000000;

platform.configuration.server.http.default.timeout = 15000;

platform.configuration.server.http.default.compression = {
  'enable': true,
  'limit': 1024
};

//T: improve with support for match multiple rules
//O: Contains common defaults for HTTP security.
platform.configuration.server.http.default.reject = {};
//V: Define default regexp to reject request by URI.
//H: Filter is applied against request relative URI cleaned by querystring.
platform.configuration.server.http.default.reject.url = /^\/LICENSE|^\/README|\/\.|\.exe$|\.dll$|\.class$|\.jar$|\.server\.js$|\.json$|^\/bin\/|^\/build\/|^\/cache\/|^\/core\/|^\/data\/|^\/external\/|^\/log\/|^\/node_modules\/|\/^\/project\/|^\/stats\/|^\/test\/|^\/tmp\/|^\/tools\//;

//O: Contains default HTTP redirect configuration.
//H: Filters are applied against request relative URI cleaned by querystring.
platform.configuration.server.http.default.redirect = {
  //V: Define new redirector name.
  'redirect_by_string': {
    //V: Define string to be searched into URL as string.
    'filter': '/example',
    //V: Define new URI to redirect to, as string.
    'to': 'http://example.com/ljve/'
  },
  //V: Define new redirector name.
  'redirect_by_regexp': {
    //V: Define string to be searched into URL as regexp.
    'filter': /^\/examplex(.*)/,
    //V: Define new URI to redirect to, as string but with regexp grouping support.
    'to': 'http://example.com/$1/'
  },
  //V: Define new redirector name.
  'redirect_by_function': {
    //V: Define function to be called for custom tests.
    'filter': function(){
      return false;
    },
    //V: Define new URI to redirect to, as string but with regexp grouping support.
    'to': 'http://example.com/$1/'
  }
};

//T: allow port specific configuration
//O: Contains default mime types by extension.
platform.configuration.server.http.default.mimetypes = {
  '.json': 'application/json',
  '.jsa': 'application/json',
  '.jtl': 'application/x-jtl',
  '.htl': 'application/x-htl',
  '.dml': 'application/x-dml',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.shtml': 'text/html',
  '.css': 'text/css',
  '.xml': 'text/xml',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/x-javascript',
  '.atom': 'application/atom+xml',
  '.rss': 'application/rss+xml',
  '.mml': 'text/mathml',
  '.txt': 'text/plain',
  '.jad': 'text/vnd.sun.j2me.app-descriptor',
  '.wml': 'text/vnd.wap.wml',
  '.htc': 'text/x-component',
  '.png': 'image/png',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.wbmp': 'image/vnd.wap.wbmp',
  '.ico': 'image/x-icon',
  '.jng': 'image/x-jng',
  '.bmp': 'image/x-ms-bmp',
  '.svg': 'image/svg+xml',
  '.svgz': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jar': 'application/java-archive',
  '.war': 'application/java-archive',
  '.ear': 'application/java-archive',
  '.hqx': 'application/mac-binhex40',
  '.doc': 'application/msword',
  '.pdf': 'application/pdf',
  '.ps': 'application/postscript',
  '.eps': 'application/postscript',
  '.ai': 'application/postscript',
  '.rtf': 'application/rtf',
  '.xls': 'application/vnd.ms-excel',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.wmlc': 'application/vnd.wap.wmlc',
  '.kml': 'application/vnd.google-earth.kml+xml',
  '.kmz': 'application/vnd.google-earth.kmz',
  '.7z': 'application/x-7z-compressed',
  '.cco': 'application/x-cocoa',
  '.jardiff': 'application/x-java-archive-diff',
  '.jnlp': 'application/x-java-jnlp-file',
  '.run': 'application/x-makeself',
  '.pl': 'application/x-perl',
  '.pm': 'application/x-perl',
  '.prc': 'application/x-pilot',
  '.pdb': 'application/x-pilot',
  '.rar': 'application/x-rar-compressed',
  '.rpm': 'application/x-redhat-package-manager',
  '.sea': 'application/x-sea',
  '.swf': 'application/x-shockwave-flash',
  '.sit': 'application/x-stuffit',
  '.tcl': 'application/x-tcl',
  '.tk': 'application/x-tcl',
  '.der': 'application/x-x509-ca-cert',
  '.pem': 'application/x-x509-ca-cert',
  '.crt': 'application/x-x509-ca-cert',
  '.xpi': 'application/x-xpinstall',
  '.xhtml': 'application/xhtml+xml',
  '.zip': 'application/zip',
  '.bin': 'application/octet-stream',
  '.exe': 'application/octet-stream',
  '.dll': 'application/octet-stream',
  '.deb': 'application/octet-stream',
  '.dmg': 'application/octet-stream',
  '.eot': 'application/octet-stream',
  '.iso': 'application/octet-stream',
  '.img': 'application/octet-stream',
  '.msi': 'application/octet-stream',
  '.msp': 'application/octet-stream',
  '.msm': 'application/octet-stream',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',
  '.kar': 'audio/midi',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/x-m4a',
  '.ra': 'audio/x-realaudio',
  '.3gpp': 'video/3gpp',
  '.3gp': 'video/3gpp',
  '.mp4': 'video/mp4',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.flv': 'video/x-flv',
  '.m4v': 'video/x-m4v',
  '.mng': 'video/x-mng',
  '.asx': 'video/x-ms-asf',
  '.asf': 'video/x-ms-asf',
  '.wmv': 'video/x-ms-wmv',
  '.avi': 'video/x-msvideo'
};

//O: Contains global debugging configuration.
platform.configuration.server.debugging = {
  //V: Enable or disable global verbose HTTP debug log.
  'http': true,
  //V: Enable or disable global verbose WebSocket debug log.
  'websocket': true,
  //V: Enable or disable global verbose memory watcher debug log.
  'memory': true,
  //V: Enable or disable global verbose code load debug log.
  'load': true,
  //V: Enable or disable global verbose cache debug log.
  'cache': true,
  //V: Enable or disable global verbose session debug log.
  'session': true,
  //V: Enable or disable global verbose bootstrap debug log.
  'bootstrap': true,
  'messaging': {
    'mail': true
  },
  'handler': true,
  'fastcgi': false,
  'parser': {
    'js': false
  }
};

//O: Contains memory management configuration.
platform.configuration.server.memory = {};

//O: Contains memory garbage collector configuration.
platform.configuration.server.memory.gc = {
  //V: Enable or disable forced garbage collector.
  'force': true,
  //V: Define forced garbage collection interval (ms).
  'interval': 1000*60*1
};

//T: support multiple backends by configuration
/*
//O: Contains IO and store configuration.
platform.configuration.server.io = {};

//O: Contains store specific configuration.
platform.configuration.server.io.store = platform.configuration.server.io.store || {};

//O: Contains multiple custom backends for IO multistore support.
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

platform.configuration.client = {};

platform.configuration.client.bootstrap = {};

platform.configuration.client.bootstrap.root = 'platform._bootstrap.seed';
platform.configuration.client.bootstrap.loader = 'platform._bootstrap.load';

platform.configuration.cache = {
  'startup': {
    'clean': true
  }
};

platform.configuration.engine = {};

platform.configuration.engine.session = {};

platform.configuration.engine.session.gc = {
  'generational': true,
  'poll': 5000,
  'state': {
    'socket': 5000,
    'http': 10000,
    'dispose': 10000,
    'time': 60000,
    'bootstrap': 10000
  }
};

platform.configuration.engine.messaging = {};

platform.configuration.engine.messaging.mail = {
  'enable': false,
  'account': {
    'host': 'localhost',
    'port': '25',
    'secure': true,
    'tls': {
      'rejectUnauthorized': false
    },
    'auth': {
      'user': '',
      'pass': ''
    },
    'authMethod': 'PLAIN',
    'maxConnections': 5,
    'maxMessages': 100
  }
};

platform.configuration.engine.handlers = {
  'php': {
    'filter': /^\/php/gi,
    'type': 'fastcgi',
    //'to': '$1',
    'strip': 1,
    'socket': 'tmp/php-fpm.sock',
    //'host': '',
    //'port': 8081,
    'headers': {
      'mask': {
        'in': [ 'keep-alive', 'set-cookie' ],
        'out': [ 'connection', 'cache-control', 'cookie' ]
      },
      'keep': []
    },
    'daemon': {
      'exec': '/usr/sbin/php5-fpm -p `pwd` -y test/files/php/php-fpm.conf -F',
      'root': null
    },
    'debug': true
  },
  'http': {
    'filter': /\/git\/(.*?)$/gi,
    'type': 'http',
    'to': 'https://raw.githubusercontent.com/to_strip/marcominetti/ljve.io/master/$1',
    'strip': 1,
    'headers': {
      'mask': {
        'in': [
          'keep-alive',
          'etag',
          'access-control-allow-origin',
          'content-security-policy',
          'x-xss-protection',
          'x-frame-options',
          'x-content-type-options',
          'strict-transport-security',
          'cache-control',
          'via',
          'x-served-by',
          'x-cache',
          'x-cache-hits',
          'vary',
          'source-age',
          'connection',
          'accept-ranges',
          'set-cookie'
        ],
        'out': [ 'connection', 'cache-control', 'if-none-match', 'cookie' ]
      },
      'keep': []
    },
    'debug': true
  },
  'coverage_by_function': {
    'filter': function(){
      return (/^\/coverage$/gi).test(context.call.url.pathname);
    },
    'type': 'invoke',
    'invoke': function(){
      context.call.url.pathname = '/project/stats/coverage.html';
      platform.engine.process.file();
    },
    'debug': true
  }
};

platform.configuration.addons = {};

platform.configuration.addons.css = {};

platform.configuration.addons.css.reset = {
  'enable': true
};

platform.configuration.addons.google = {};

platform.configuration.addons.google.analytics = {
  'enable': false,
  'id': '',
  'domain': ''
};
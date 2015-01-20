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

platform.client = platform.client || {};

//N: Provides client bootstrap helper methods and classes.
platform.client.bootstrap = platform.client.bootstrap || {};

//O: Stores session-fake bootstrap objects.
platform.client.bootstrap._store = {};

//V: Specifies the regular expression for validating bootstrap id.
platform.client.bootstrap._validate_id_check = /^[a-zA-Z0-9]{8}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{12}$/;

//F: Registers a new bootstrap session.
//R: Returns the bootstrap id.
platform.client.bootstrap.register = function() {
  platform.statistics.counter('bootstraps.total').inc();
  platform.statistics.counter('bootstraps.active').inc();

  //C: create new bootstrap id and object
  var bootstrap_id = native.uuid.v4();
  while(platform.client.bootstrap._store.hasOwnProperty(bootstrap_id) === true) {
    bootstrap_id = native.uuid.v4();
  }

  var session = {
    'id': bootstrap_id,
    'identity': {
      'browser': native.useragent.parse(context.request.headers['user-agent']),
      'client': {
        'address': context.request.client.address,
        'port': context.request.client.port
      },
      'server': {
        'address': context.request.connection.address().address,
        'port': context.request.connection.address().port
      }
    },
    '_session':{
      'start': Date.now(),
      'timeout': platform.configuration.engine.session.gc.state.bootstrap,
      'lease': Date.now() + platform.configuration.engine.session.gc.state.bootstrap,
      'working': 0,
      'files':[]
    }
  };

  platform.client.bootstrap._store[bootstrap_id] = session;

  if(platform.configuration.server.debugging.bootstrap === true) {
    console.debug('new bootstrap %s (%s) registered',session.id,session.identity.client.address);
  }

  return bootstrap_id;
};

//F: Unregisters a bootstrap session (invoked when bootstrap expires with no release).
//A: bootstrap_id: Specifies the bootstrap id to unregister.
platform.client.bootstrap.unregister = function(bootstrap_id) {
  if (platform.client.bootstrap.isValid(bootstrap_id) === true) {
    if (platform.client.bootstrap.exist(bootstrap_id) === true) {
      var session = platform.client.bootstrap._store[bootstrap_id];

      if(platform.configuration.server.debugging.bootstrap === true) {
        console.debug('bootstrap %s unregistered after %s',session.id,Number.toHumanTime(Date.now()-session._session.start));
      }

      //T: store stats somewhere...

      platform.statistics.counter('bootstraps.active').dec();
      platform.statistics.counter('bootstraps.expired').inc();

      return delete platform.client.bootstrap._store[bootstrap_id];
    } else {
      throw new Exception('bootstrap %s does not exist',bootstrap_id);
    }
  } else {
    throw new Exception('bootstrap id %s is not valid',bootstrap_id);
  }
  return false;
};

//F: Checks if bootstrap id is valid.
//A: bootstrap_id: Specifies the bootstrap id to validate.
//R: Returns true if the bootstrap id is valid, false otherwise.
platform.client.bootstrap.isValid = function (bootstrap_id){
  return (platform.client.bootstrap._validate_id_check.test(bootstrap_id) && (platform.client.bootstrap._validate_id_check.lastIndex = 0) === 0);
};

//F: Checks whether a session is registered in current environment.
//A: bootstrap_id: Specifies name of new class to check.
//R: Returns true if session is registered.
platform.client.bootstrap.exist = function(bootstrap_id){
  return (platform.client.bootstrap._store.hasOwnProperty(bootstrap_id));
};

//F: Gets bootstrap object by bootstrap id.
//A: bootstrap_id: Specifies bootstrap id to return.
//R: Returns the bootstrap object.
platform.client.bootstrap.get = function(bootstrap_id) {
  if (platform.client.bootstrap.isValid(bootstrap_id) === true) {
    if (platform.client.bootstrap.exist(bootstrap_id) === true) {
      return platform.client.bootstrap._store[bootstrap_id];
    } else {
      throw new Exception('bootstrap %s does not exist',bootstrap_id);
    }
  } else {
    throw new Exception('bootstrap id %s is not valid',bootstrap_id);
  }
};

platform.client.bootstrap.seed = function() {
  platform.statistics.counter('bootstraps.seed').inc();

  context.response.setHeader('Content-Type', 'text/html');

  if (platform.configuration.application.available === false) {
   platform.statistics.counter('bootstraps.unavailable').inc();
   platform.client.bootstrap.sendpage('/core/client/unavailable.html',"ga('send', 'event', { 'eventCategory': 'app', 'eventAction': 'unavailable' });");
   return;
  }

  //T: post custom page during maintenance

  var browser = native.useragent.parse(context.request.headers['user-agent']);

  //C: checking if browser is supported
  if (platform.client.bootstrap.isSupported(browser) === false) {
    platform.statistics.counter('bootstraps.unsupported').inc();
    //C: redirecting unsupported page
    platform.client.bootstrap.sendpage('/core/client/unsupported.html',"ga('send', 'event', { 'eventCategory': 'app', 'eventAction': 'unsupported' });");
    //T: store statistics for unsupported browsers
    return;
  }

  //T: delete cache if configuration changed...
  if (platform.io.cache.is('/bootloader.html') === false) {
    //C: preparing bootstrap page
    var content = '';

    content += '<!DOCTYPE html><html><head>';

    content += '<script type="text/javascript">';
    content += platform.io.get.string('/lib/jquery.js');
    content += platform.io.get.string('/lib/jquery.migrate.js');
    content += 'jQuery.migrateMute = true;';
    content += platform.io.get.string('/lib/jquery.transit.js');
    content += platform.io.get.string('/lib/jquery.knob.js');
    content += platform.io.get.string('/lib/jquery.sparkline.js');
    content += platform.io.get.string('/lib/crypto.js');

    content += '</script>';

    if (platform.configuration.addons.google.analytics.enable === true && platform.configuration.addons.google.analytics.id !== '') {
      content += '<script>(function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,\'script\',\'//www.google-analytics.com/analytics.js\',\'ga\');';
      content += 'ga(\'create\', \'' + platform.Configuration.platform.Common.Addons.Google.Analytics.ID + '\', \'' + platform.Configuration.Application.Domain + '\');ga(\'send\', \'event\', { \'eventCategory\': \'app\', \'eventAction\': \'bootstrap\' });';
      content += '</script>';
    }

    //T: migrate extjs/dojo support from 0.3.x branch

    content += '<script type="text/javascript">';

    var bootstrap_code = '';
    var bootstrap_path = '/core/client/bootstrap.js';
    if (platform.io.cache.is(bootstrap_path) === true) {
      bootstrap_code = platform.io.cache.get.string(bootstrap_path);
    } else {
      //T: compress/minify bootloader.js
      bootstrap_code = platform.io.get.string (bootstrap_path);
      platform.io.cache.set.string(bootstrap_path,null,bootstrap_code);
    }

    content += bootstrap_code;

    content += '</script>';
    content += '<script type="text/javascript">if (window.attachEvent) window.attachEvent(\'onload\', bootstrap); else window.addEventListener(\'load\', bootstrap, true);</script>';

    content += '</head><body>';

    var bootstrap_ui_code = '';
    var bootstrap_ui_path = null;
    if (platform.runtime.development === true) {
      bootstrap_ui_path = '/core/client/bootloader.debug.html';
    } else {
      bootstrap_ui_path = '/core/client/bootloader.release.html';
    }

    if (platform.io.cache.is(bootstrap_ui_path) === true) {
      bootstrap_ui_code = platform.io.cache.get.string(bootstrap_ui_path);
    } else {
      //T: compress/minify html (diff-ready?)
      bootstrap_ui_code = platform.io.get.string(bootstrap_ui_path);
      platform.io.cache.set.string(bootstrap_ui_path,null,bootstrap_ui_code);
    }
    content += bootstrap_ui_code;
    content += '</body></html>';

    //C: returning page html code
    platform.io.cache.set.string('/bootloader.html',null,content);
  }

  platform.engine.send.cache('/bootloader.html');
};

//F: Promotes a bootstrap session to a new full session.
//A: statistics_data: Specifies the bootstrap phase data collected.
//A: oldsession_data: Specifies the session data to join existing session (if any).
//A: relogin_data: Specifies the auto relogin info.
//R: Returns release data separated by ':' (session_id,session_token,engine_id,logged_in:[0|1]).
platform.client.bootstrap.release = function(statistics_data,oldsession_data,relogin_data) {
  var bootstrap_id = context.session.id;

  if (platform.client.bootstrap.isValid(bootstrap_id) === true) {
    if (platform.client.bootstrap.exist(bootstrap_id) === true) {
      var early_session = platform.client.bootstrap._store[bootstrap_id];

      //T: store statistics somewhere (with client stats too)...

      var session = null;
      var session_id = null;
      var session_token = null;

      if (oldsession_data != null) {
        var oldsession_data_parts = oldsession_data.split(':');
        session_id = oldsession_data_parts[0];
        session_token = oldsession_data_parts[1];
        //var engine_id = oldsession_data_parts[2];
        //T: engine id should be consistent for unmodified app servers (core modules)
        //if (platform.engine.id === engine_id) {
          if (platform.sessions.isValid(session_id) === true) {
            if (platform.sessions.exist(session_id) === true) {
              session = platform.sessions._store[session_id];

              if (session._session.token !== session_token) {
                session = null;
              } else {
                if (Object.keys(session.sockets).length === 0 || (Object.keys(session.sockets).length === 1 && Object.keys(session.sockets)[0] === "fakefunnel")) {
                  session._session.files = early_session._session.files;
                  session._session.modules = [];
                  session._session.handlers = {};
                  session._session.timeout = platform.configuration.engine.session.gc.state.http;
                  session._session.lease = Date.now() + platform.configuration.engine.session.gc.state.http;
                  if (session.state == 0 || session.state == 2) {
                    session.state = 1;
                    platform.statistics.counter('sessions.gen1').inc();
                    platform.statistics.counter('sessions.gen' + session.state).dec();
                  }
                  if(platform.configuration.server.debugging.session === true) {
                    switch (session.state) {
                      case 0:
                        console.debug('session %s moved to state 0 (forgotten)', session.name);
                        break;
                      case 1:
                        console.debug('session %s moved to state 1 (http alive)', session.name);
                        break;
                      case 2:
                        console.debug('session %s moved to state 2 (socket alive)', session.name);
                        break;
                      case 3:
                        console.debug('session %s moved to state 3 (time alive)', session.name);
                        break;
                      case 4:
                        console.debug('session %s moved to state 4 (persistent)', session.name);
                        break;
                    }
                  }
                }
              }
            }
          }
        //}
      }
      if (session == null) {
        var session_parts = platform.sessions.register().split(':');
        session_id = session_parts[0];
        session_token = session_parts[1];
        session = platform.sessions._store[session_id];
        session._session.files = early_session._session.files;
      }

      //T: relogin

      platform.statistics.counter('bootstraps.active').dec();
      platform.statistics.counter('bootstraps.succeed').inc();
      delete (platform.client.bootstrap._store[bootstrap_id]);

      if (platform.configuration.server.debugging.bootstrap === true) {
        console.debug('bootstrap %s released to session %s after %s',bootstrap_id,session.name,Number.toHumanTime(Date.now()-session._session.start));
      }

      return session_id + ':' + session_token + ':' + platform.engine.id + ':' + (/*(platform.account.isAuthenticated(session_id) === true) ? '1' :*/ '0');
    } else {
      throw new Exception('bootstrap %s does not exist',bootstrap_id);
    }
  } else {
    throw new Exception('bootstrap id %s is not valid',bootstrap_id);
  }
};

platform.client.bootstrap.sendpage = function(path,ga_code) {
  if (platform.io.cache.is(path) === false) {
    var content = platform.io.get.string(path);
    var ga_script = '';
    if (platform.configuration.addons.google.analytics.enable === true && platform.configuration.addons.google.analytics.id !== '') {
      ga_script = '<script>(function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,\'script\',\'//www.google-analytics.com/analytics.js\',\'ga\');';
      ga_script += 'ga(\'create\', \'' + platform.configuration.addons.google.analytics.id + '\', \'' + platform.configuration.addons.google.analytics.domain + '\');';
      ga_script += ga_code;
      ga_script += '</script>';
    }
    content = content.replace('<script type="text/javascript" addon />', ga_script);
    platform.io.cache.set.string(path,null,content);
  }
  platform.engine.send.cache(path);
};

//F: Starts a bootstrap for new connection requests.
platform.client.bootstrap.load = function() {
  //T: delete cache if configuration changed...

  if (platform.io.cache.is('/bootloader.js') === false) {
    var bootloader_code = '';
    var bootloader_path = '/core/client/bootloader.js';
    if (platform.io.cache.is(bootloader_path) === true) {
      bootloader_code = platform.io.cache.get.string(bootloader_path);
    } else {
      //T: compress/minify bootloader.js
      bootloader_code = platform.io.get.string (bootloader_path);
      platform.io.cache.set.string(bootloader_path,null,bootloader_code);
    }

    //T: add runtime vars for bootloader

    platform.io.cache.set.string('/bootloader.js',null,bootloader_code);
  }

  var bootstrap_id = platform.client.bootstrap.register();
  context.response.setHeader('X-Platform-Bootstrap', bootstrap_id);

  platform.engine.send.cache('/bootloader.js');
};

platform.client.bootstrap.list = function() {
  return Object.keys(platform.client.bootstrap._store);
};

platform.io.cache.unset('/bootloader.html');
platform.io.cache.unset('/bootloader.js');
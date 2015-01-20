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

//N: Provides a sessions management engine.
platform.sessions = platform.sessions || {};

//O: Stores the registered sessions objects.
platform.sessions._store = {};

//V: Specifies the regular expression for validating session id.
platform.sessions._validate_id_check = /^[a-zA-Z0-9]{8}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{12}$/;

//F: Registers a new session.
//R: Returns the session id and token separated by ':'.
platform.sessions.register = function() {
  var session_id = native.uuid.v4();
  while(platform.sessions.exist(session_id) === true) {
    session_id = native.uuid.v4();
  }

  var session_token = native.uuid.v4();

  //T: set readonly name, id, ...
  var session = {
    'name': session_id,
    'id': session_id,
    'identity':{
      'token': session_token,
      '_store': null,
      'user': null,
      'service': false,
      'browser': (context.session != null) ? context.session.browser : native.useragent.parse(context.request.headers['user-agent']),
      'client': (context.session != null) ? context.session.client : {
        'address': context.request.client.address,
        'port': context.request.client.port
      },
      'server': (context.session != null) ? context.session.server : {
        'address': context.request.connection.address().address,
        'port': context.request.connection.address().port
      }
    },
    'state':1,
    'sockets': {
      '_auth': {}
    },
    'visible': true,
    '_session': {
      'start': Date.now(),
      'timeout': platform.configuration.engine.session.gc.state.http,
      'lease': Date.now() + platform.configuration.engine.session.gc.state.http,
      'working': 0,
      'files':[],
      'modules':[],
      'storage':{},
      'handlers': {},
      'engine': platform.engine.id
    },
    'global':{}
  };

  platform.sessions._store[session_id] = session;
  context.session = session;

  //T: create identity/login as anonymous
  //T: create identity/login from httpauth

  //T: wrap remote objects for session

  if(platform.configuration.server.debugging.session === true) {
    console.debug('new session %s (%s) registered',session.name,session.identity.client.address);
  }

  if (platform.configuration.engine.session.gc.generational === false) {
    session._session.timeout = platform.configuration.engine.session.gc.state.time;
    session._session.lease = Date.now() + platform.configuration.engine.session.gc.state.time;
    session.state = 3;
    platform.statistics.counter('session.gen3').inc();
    if(platform.configuration.server.debugging.session === true) {
      console.debug('session %s moved to state 3 (time alive)', session.name);
    }
  } else {
    platform.statistics.counter('session.gen1').inc();
    if(platform.configuration.server.debugging.session === true) {
      console.debug('session %s moved to state 1 (http alive)', session.name);
    }
  }

  platform.statistics.counter('sessions.total').inc();
  platform.statistics.counter('sessions.active').inc();
  //T: raise platform.event.raise('session.register');

  return session_id + ':' + session_token;
};

//F: Unregisters a session.
//A: session_id: Specifies session id to unregister.
platform.sessions.unregister = function(session_id) {
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      var session = platform.sessions._store[session_id];

      if (session.state === 4) {
        return false;
      }

      platform.statistics.counter('sessions.active').dec();
      platform.statistics.counter('sessions.gen' + session.state).dec();

      if (session.identity.user == null) {
        platform.statistics.counter('users.anonymous').dec();
      } else {
        platform.statistics.counter('users.logged').dec();
        //T: Platform.Events.Raise('user.logout');
      }

      //T: platform.events.raise('session.unregister');

      if(platform.configuration.server.debugging.session === true) {
        console.debug('session %s unregistered after %s',session.name,Number.toHumanTime(Date.now()-session._session.start));
      }

      platform.sessions.pools.remove(session_id);

       return (delete platform.sessions._store[session_id]);

      //T: clean socket auths for session

      //T: clean remote events attachers for session
    } else {
      throw new Exception('session %s does not exist',session_id);
    }
  } else {
    throw new Exception('session id %s is not valid',session_id);
  }
  return false;
};

//F: Sets a session to be persistent or time-based.
//A: session_id: Specifies session id to set.
//A: [persistent]: Specifies if session must be set to persistent state. Default is false.
platform.sessions.promote = function(session_id,persistent) {
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      var session = platform.sessions._store[session_id];

      if (persistent === true) {
        session._session.timeout = 0;
        session._session.lease = 0;
        session.state = 4;
        platform.statistics.counter('sessions.gen' + session.state).dec();
        platform.statistics.counter('sessions.gen4').inc();
        if(platform.configuration.server.debugging.session === true) {
          console.debug('session %s moved to state 4 (persistent)', session.name);
        }
      } else {
        session._session.timeout = platform.configuration.engine.session.gc.state.time;
        session._session.lease = Date.now() + platform.configuration.engine.session.gc.state.time;
        session.state = 3;
        platform.statistics.counter('sessions.gen' + session.state).dec();
        platform.statistics.counter('sessions.gen3').inc();
        if(platform.configuration.server.debugging.session === true) {
          console.debug('session %s moved to state 3 (time alive)', session.name);
        }
      }
    } else {
      throw new Exception('session %s does not exist',session_id);
    }
  } else {
    throw new Exception('session id %s is not valid',session_id);
  }
};

//F: Gets all active sessions.
//A: [includeHidden]: Specifies whether to list also hidden sessions (session.visible === false), default is false.
//R: Returns a list of active sessions' IDs.
platform.sessions.list = function(include_hidden) {
  var session_list = Object.keys(platform.sessions._store);
  if (include_hidden === true){
    return session_list;
  } else {
    return session_list.filter(function (session_id) {
      var session = platform.sessions._store[session_id];
      return (session.visible === true);
    });
  }
};

//F: Gets count of all active sessions.
//A: [includeHidden]: Specifies whether to count also hidden sessions (session.visible === false), default is false.
//R: Returns count of active sessions.
platform.sessions.count = function(include_hidden) {
  return platform.sessions.list(include_hidden).length;
};

//F: Checks if passed session is the current.
//A: session_id: Specifies session id to check.
//R: Returns true if passed session is the current, false otherwise.
platform.sessions.isCurrent = function (session_id) {
  return (session_id === context.session);
};

//F: Checks if session id is valid.
//A: session_id: Specifies the session id to validate.
//R: Returns true if the session id is valid, false otherwise.
platform.sessions.isValid = function (session_id){
  return (platform.sessions._validate_id_check.test(session_id) && (platform.sessions._validate_id_check.lastIndex = 0) === 0);
};

//F: Checks whether a session is registered in current environment.
//A: session_id: Specifies name of new class to check.
//R: Returns true if session is registered.
platform.sessions.exist = function(session_id){
  return platform.sessions._store.hasOwnProperty(session_id);
};

//F: Gets session object by session id.
//A: session_id: Specifies session id to return.
//R: Returns the session object.
platform.sessions.get = function(session_id) {
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      return platform.sessions._store[session_id];
    } else {
      throw new Exception('session %s does not exist',session_id);
    }
  } else {
    throw new Exception('session id %s is not valid',session_id);
  }
};

//F: Gets session objects by session name.
//A: session_name: Specifies the session name.
//R: Returns an array of session objects.
platform.sessions.getByName = function(session_name) {
  var session_list = [];
  platform.sessions.list(true).forEach(function(session_id){
    var session = platform.sessions._store[session_id];
    if (session.name === session_name){
      session_list.push(session);
    } else {
      if (session.name.replace('.'+session_id,'') === session_name) {
        session_list.push(session);
      }
    }
  });
  if (session_list.length > 0) {
    return session_list;
  }
  return null;
};
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

//N: Provides a sessions management engine.
platform.sessions = platform.sessions || {};

platform.sessions._saved = [];

platform.sessions._export = function(session_id){
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      var session = platform.sessions.get(session_id);

      var data_to_store = {};
      data_to_store.name = session.name;
      data_to_store.id = session.id;
      data_to_store.identity = session.identity;
      data_to_store.state = 0;
      data_to_store.sockets = {
        '_auth': session.sockets._auth
      };
      data_to_store.visible = session.visible;
      data_to_store._session = {};
      data_to_store._session.start = session._session.start;
      data_to_store._session.timeout = platform.configuration.engine.session.gc.state.dispose;
      data_to_store._session.lease = 0;
      data_to_store._session.working = 0;
      data_to_store._session.files = [];
      data_to_store._session.modules = [];
      data_to_store._session.storage = session._session.storage;
      data_to_store._session.engine = session._session.engine;
      data_to_store.global = {};

      platform.sessions._backend.set.string(session_id,JSON.stringify(data_to_store));

      if(platform.configuration.server.debugging.session === true) {
        console.debug('session %s exported to persistent store',session.name);
      }
    } else {
      throw new Exception('session %s does not exist',pool_id);
    }
  } else {
    throw new Exception('session id %s is not valid',pool_id);
  }
};

platform.sessions._import = function(session_id){
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions._exist(session_id) === true) {
      var session = JSON.parse(platform.sessions._backend.get.string(session_id));

      session._session.timeout = platform.configuration.engine.session.gc.state.dispose;
      session._session.lease = Date.now() + session._session.timeout;

      platform.sessions._store[session_id] = session;

      platform.sessions._saved.splice(platform.sessions._saved.indexOf(session_id),1);
      platform.sessions._backend.delete('session_id');

      if(platform.configuration.server.debugging.session === true) {
        console.debug('session %s imported from persistent store',session.name);
      }
    } else {
      throw new Exception('session %s does not exist',pool_id);
    }
  } else {
    throw new Exception('session id %s is not valid',pool_id);
  }
};

platform.sessions._load = function() {
  platform.sessions._saved = platform.sessions._backend.list();
  platform.sessions._saved.forEach(function(session_id){
    platform.sessions._import(session_id);
  });
};

platform.sessions._list = function(){
  return platform.sessions._saved;
};

platform.sessions._exist = function(session_id){
  return (platform.sessions._saved.indexOf(session_id) !== -1);
};

//C: registering 'session' store as new filesystem backend with app root path + /data/session/
//T: allow session store override by configuration
platform.io.store.register('session',platform.kernel.new('core.io.store.file',[ native.path.join(platform.runtime.path.app,'data/session') ]),-1);

//V: Stores the 'session' store backend.
platform.sessions._backend = platform.io.store.getByName('session');

//T: load on event platform.ready
platform.sessions._load();
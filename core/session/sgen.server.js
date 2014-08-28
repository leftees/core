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

platform.sessions = platform.sessions || {};

platform.sessions.gc = platform.sessions.gc || {};

platform.sessions.gc._interval = null;

platform.sessions.gc.start = function(){
  if (platform.sessions.gc._interval === null){
    platform.sessions.gc._interval = setInterval(platform.sessions.gc.collect, platform.configuration.engine.session.gc.poll);
  } else {
    throw new Error();
  }
};

platform.sessions.gc.stop = function(){
  if (platform.sessions.gc._interval != null){
    clearInterval(platform.sessions.gc._interval);
    platform.sessions.gc._interval = null;
  } else {
    throw new Error();
  }
};

platform.sessions.gc.collect = function(){

  var lease = Date.now();

  var session_list = platform.sessions.list(true);

  session_list.forEach(function(session_id){
    var session = platform.sessions.get(session_id);
    if (session._session.timeout > 0 && session._session.lease < lease && session._session.working === 0) {
      platform.sessions.collect(session_id);
    }
  });

  if (platform._bootstrap != null) {

    var fake_session_list = platform._bootstrap.list();

    fake_session_list.forEach(function (bootstrap_id) {
      var fake_session = platform._bootstrap.get(bootstrap_id);
      if (fake_session._session.lease < lease && fake_session._session.working === 0) {
        platform._bootstrap.unregister(bootstrap_id);
      }
    });
  }

};


//F: Collects a session throughout the generational model.
//A: session_id: Specifies session id to collect.
platform.sessions.collect = function(session_id) {
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      var session = platform.sessions.get(session_id);
      switch (session.state) {
        case 0:
          if(platform.configuration.server.debugging.session === true) {
            console.debug('session %s reaches end of life', session.name);
          }
          platform.sessions.unregister(session_id);
          break;
        case 1:
          //T: clear authentication
          session._session.timeout = platform.configuration.engine.session.gc.state.dispose;
          session._session.lease = Date.now() + platform.configuration.engine.session.gc.state.dispose;
          session.state = 0;
          platform.statistics.counter('sessions.gen0').inc();
          platform.statistics.counter('sessions.gen1').dec();
          if(platform.configuration.server.debugging.session === true) {
            console.debug('session %s moved to state 0 (forgotten)', session.name);
          }
          break;
        case 2:
          if (Object.keys(session.sockets).length > 1 || (Object.keys(session.sockets).length === 1 && Object.keys(session.sockets)[0] !== "fakefunnel") ){
            return;
          }
          session.Sockets = {};
          session._session.timeout = platform.configuration.engine.session.gc.state.http;
          session._session.lease = Date.now() + platform.configuration.engine.session.gc.state.http;
          session.state = 1;
          platform.statistics.counter('sessions.gen1').inc();
          platform.statistics.counter('sessions.gen2').dec();
          if(platform.configuration.server.debugging.session === true) {
            console.debug('session %s moved to state 1 (http alive)', session.name);
          }
          break;
        case 3:
          if (Object.keys(session.sockets).length > 1 || (Object.keys(session.sockets).length === 1 && Object.keys(session.sockets)[0] !== "fakefunnel") ){
            session._session.lease = Date.now() + platform.configuration.engine.session.gc.state.time;
            return;
          }
          if(platform.configuration.server.debugging.session === true) {
            console.debug('session %s (kept alive) reaches end of life', session.name);
          }
          platform.sessions.unregister(session_id);
          break;
      }

    }
  }
};

//T: start on event platform.ready
platform.sessions.gc.start();
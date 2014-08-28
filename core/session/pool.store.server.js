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
platform.sessions.pools = platform.sessions.pools || {};

platform.sessions.pools._saved = [];

platform.sessions.pools._export = function(pool_id){
  if (platform.sessions.pools.isValid(pool_id) === true) {
    if (platform.sessions.pools.exist(pool_id) === true) {
      var pool = platform.sessions.pools.get(pool_id);

      var data_to_store = pool;

      platform.sessions.pools._backend.set.string(pool_id,JSON.stringify(data_to_store));

      if(platform.configuration.server.debugging.session === true) {
        console.debug('session pool %s exported to persistent store',pool.name);
      }
    } else {
      throw new Exception('session pool %s does not exist',pool_id);
    }
  } else {
    throw new Exception('session pool id %s is not valid',pool_id);
  }
};

platform.sessions.pools._import = function(pool_id){
  if (platform.sessions.pools.isValid(pool_id) === true) {
    if (platform.sessions.pools._exist(pool_id) === true) {
      var pool = JSON.parse(platform.sessions.pools._backend.get.string(pool_id));

      pool.sessions = pool.sessions.filter(function(session_id){
        return (platform.sessions.isValid(session_id) === true && platform.sessions.exist(session_id) === true);
      });

      platform.sessions.pools._store[pool_id] = pool;

      platform.sessions.pools._saved.splice(platform.sessions.pools._saved.indexOf(pool_id),1);
      platform.sessions.pools._backend.delete('pool_id');

      if(platform.configuration.server.debugging.session === true) {
        console.debug('session pool %s imported from persistent store',pool.name);
      }
    } else {
      throw new Exception('session pool %s not found to import',pool_id);
    }
  } else {
    throw new Exception('session pool id %s is not valid',pool_id);
  }
};

platform.sessions.pools._load = function() {
  platform.sessions.pools._saved = platform.sessions.pools._backend.list();
  platform.sessions.pools._saved.forEach(function(pool_id){
    platform.sessions.pools._import(pool_id);
  });
};

platform.sessions.pools._list = function(){
  return platform.sessions.pools._saved;
};

platform.sessions.pools._exist = function(pool_id){
  return (platform.sessions.pools._saved.indexOf(pool_id) !== -1);
};

//C: registering 'pool' store as new filesystem backend with app root path + /data/pool/
//T: allow session store override by configuration
platform.io.store.register('pool',platform.kernel.new('core.io.store.file',[ native.path.join(platform.runtime.path.app,'data/pool') ]),-1);

//V: Stores the 'pool' store backend.
platform.sessions.pools._backend = platform.io.store.getByName('pool');
//T: load on event platform.ready
platform.sessions.pools._load();
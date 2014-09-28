/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

//N: Provides a pool sessions management engine.
platform.sessions.pools = platform.sessions.pools || {};

platform.sessions.pools._store = {};

platform.sessions.pools.register = function(name, session_list){
  var session_to_add = [];
  if (session_list != null) {
    session_to_add = session_list.filter(function (session_id) {
      return (platform.sessions.isValid(session_id) && platform.sessions.exist(session_id));
    });
  }

  var pool_id = platform.sessions.pools.getByName(name);
  var pool = null;
  if (pool_id != null) {
    pool = platform.sessions.pools.get(name);

    session_to_add.forEach(function(session_id){
      platform.sessions.pools.add(session_id,pool_id);
    });

    if(platform.configuration.server.debugging.session === true) {
      console.debug('sessions added to existing pool %s',pool.name);
    }
  } else {
    pool_id = native.uuid.v4();
    while (platform.sessions.pools.exist(pool_id) === true || platform.sessions.exist(pool_id) === true) {
      pool_id = native.uuid.v4();
    }

    //T: set readonly name, id...
    pool = {
      'name': name || pool_id,
      'id': pool_id,
      'visible': true,
      'storage': {},
      'sessions': session_to_add
    };

    platform.sessions.pools._store[pool_id] = pool;

    if(platform.configuration.server.debugging.session === true) {
      console.debug('new session pool %s registered',pool.name);
    }
  }

  return pool_id;
};

platform.sessions.pools.unregister = function(pool_id){
  if (platform.sessions.pools.isValid(pool_id) === true) {
    if (platform.sessions.pools.exist(pool_id) === true) {
      var pool = platform.sessions.pools._store[pool_id];

      //T: store statistics
      //T: raise event

      if (platform.configuration.server.debugging.session === true) {
        console.debug('session pool %s unregistered', pool.name);
      }

      //T: sync sessions data?

      delete (platform.sessions.pools._store[session_id]);
    } else {
      throw new Exception('session pool %s does not exist',pool_id);
    }
  } else {
    throw new Exception('session pool id %s is not valid',pool_id);
  }
};

platform.sessions.pools.isValid = function (pool_id){
  return (platform.sessions._validate_id_check.test(pool_id) && (platform.sessions._validate_id_check.lastIndex = 0) === 0);
};

platform.sessions.pools.exist = function(pool_id){
  return platform.sessions.pools._store.hasOwnProperty(pool_id);
};

platform.sessions.pools.get = function(pool_id) {
  if (platform.sessions.pools.isValid(pool_id) === true) {
    if (platform.sessions.pools.exist(pool_id) === true) {
      return platform.sessions.pools._store[pool_id];
    } else {
      throw new Exception('session pool %s does not exist',pool_id);
    }
  } else {
    throw new Exception('session pool id %s is not valid',pool_id);
  }
};

platform.sessions.pools.list = function(include_hidden) {
  var pool_list = Object.keys(platform.sessions.pools._store);
  if (include_hidden === true){
    return pool_list;
  } else {
    return pool_list.filter(function (pool_id) {
      var pool = platform.sessions.pools._store[pool_id];
      return (pool.visible === true);
    });
  }
};

platform.sessions.pools.count = function(include_hidden) {
  return platform.sessions.pools.list(include_hidden).length;
};

platform.sessions.pools.getByName = function(name) {
  var pool_list = Object.keys(platform.sessions.pools._store);
  var result = null;
  pool_list.forEach(function(pool_id) {
    var pool = platform.sessions.pools._store[pool_id];
    if (pool.name === name){
      result = pool_id;
    }
  });
  return result;
};

platform.sessions.pools.add = function(session_id,pool_id){
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      if (pool_id == null){
        var pool_list = platform.sessions.pools.list(true);
        var result = true;
        pool_list.forEach(function(pool_id){
          result = result && platform.sessions.pools.add(session_id,pool_id);
        });
        return result;
      } else {
        if (platform.sessions.pools.isValid(pool_id) === true) {
          if (platform.sessions.pools.exist(pool_id) === true) {
            var pool = platform.sessions.pools.get(pool_id);
            if (pool.sessions.indexOf(session_id) !== -1) {
              return true;
            }
            pool.sessions.push(session_id);
            return (pool.sessions.indexOf(session_id) !== -1);
          } else {
            throw new Exception('session pool %s does not exist',pool_id);
          }
        } else {
          throw new Exception('session pool id %s is not valid',pool_id);
        }
        return false;
      }
    } else {
      throw new Exception('session %s does not exist',session_id);
    }
  } else {
    throw new Exception('session id %s is not valid',session_id);
  }
};

platform.sessions.pools.remove = function(session_id,pool_id){
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      if (pool_id == null){
        var pool_list = platform.sessions.pools.list(true);
        var result = true;
        pool_list.forEach(function(pool_id){
          result = result && platform.sessions.pools.remove(session_id,pool_id);
        });
        return result;
      } else {
        if (platform.sessions.pools.isValid(pool_id) === true) {
          if (platform.sessions.pools.exist(pool_id) === true) {
            var pool = platform.sessions.pools.get(pool_id);
            var session_index = pool.sessions.indexOf(session_id);
            if (session_index === -1) {
              return true;
            }
            pool.sessions.splice(session_index, 1);
            return (pool.sessions.indexOf(session_id) === -1);
          } else {
            throw new Exception('session pool %s does not exist',pool_id);
          }
        } else {
          throw new Exception('session pool id %s is not valid',pool_id);
        }
        return false;
      }
    } else {
      throw new Exception('session %s does not exist',session_id);
    }
  } else {
    throw new Exception('session id %s is not valid',session_id);
  }
};

platform.sessions.pools.contains = function(session_id,pool_id){
  if (platform.sessions.isValid(session_id) === true) {
    if (platform.sessions.exist(session_id) === true) {
      if (platform.sessions.pools.isValid(pool_id) === true) {
        if (platform.sessions.pools.exist(pool_id) === true) {
          var pool = platform.sessions.pools._store[pool_id];
          return (pool.sessions.indexOf(session_id) !== -1);
        } else {
          throw new Exception('session pool %s does not exist',pool_id);
        }
      } else {
        throw new Exception('session pool id %s is not valid',pool_id);
      }
    } else {
      throw new Exception('session %s does not exist',session_id);
    }
  } else {
    throw new Exception('session id %s is not valid',session_id);
  }
  return false;
};

platform.sessions.pools.clear = function(pool_id){
  if (platform.sessions.pools.isValid(pool_id) === true) {
    if (platform.sessions.pools.exist(pool_id) === true) {
      var pool = platform.sessions.pools._store[pool_id];
      pool.sessions = [];
      return true;
    } else {
      throw new Exception('session pool %s does not exist',pool_id);
    }
  } else {
    throw new Exception('session pool id %s is not valid',pool_id);
  }
  return false;
};

platform.sessions.resolve = function(session_or_pool_id, include_hidden){
  var result = [];

  if (platform.sessions.isValid(session_or_pool_id) === true) {
    if (platform.sessions.exist(session_or_pool_id) === true) {
      result.push(session_or_pool_id);
      return result;
    }
  }

  if (platform.sessions.pools.isValid(session_or_pool_id) === true) {
    if (platform.sessions.pools.exist(session_or_pool_id) === true) {
      var pool = platform.sessions.pools._store[session_or_pool_id];
      result = pool.sessions;
      return result;
    }
  }

  var test_session_id = platform.sessions.getByName(session_or_pool_id);
  if (test_session_id != null) {
    result.push(test_session_id);
    return result;
  }
  var test_pool_id = platform.sessions.pools.getByName(session_or_pool_id);
  if (test_pool_id != null) {
    var pool = platform.sessions.pools._store[test_pool_id];
    result = pool.sessions;
    return result;
  }

  var minimatch;
  minimatch = require("minimatch");

  var session_list = platform.sessions.list(include_hidden);
  session_list.forEach(function(session_id){
    var session = platform.sessions._store[session_id];
    if(session_id !== session.name && minimatch(session.name,session_or_pool_id) === true){
      if (result.indexOf(session_id) === -1) {
        result.push(session_id);
      }
    }
  });

  var pool_list = platform.sessions.pools.list(include_hidden);
  pool_list.forEach(function(pool_id){
    var pool = platform.sessions.pools._store[pool_id];
    if(pool_id !== session.name && minimatch(pool.name,session_or_pool_id) === true){
      pool.sessions.forEach(function(session_id){
        if (result.indexOf(session_id) === -1) {
          result.push(session_id);
        }
      });
    }
  });

  return result;
};

//T: autocreate pools for account groups on platform.ready event
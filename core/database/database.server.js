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

platform.database = platform.database || {};

//O: Stores the registered database schemas.
platform.database._store = platform.database._store || {};

//F: Registers a database into current environment.
//A: name: Specifies name of new database to register.
//A: db: Specifies the settings object for new database schema instance.
//R: Returns true if database is successfully registered.
platform.database.register = function(name,db){
  if (platform.database.exists(name) === false) {
    switch(db.driver){
      case 'sqlite3':
        platform.io.create(native.path.dirname(db.database)+native.path.sep);
        db.database = platform.io.map(db.database);
        break;
    }
    platform.database._store[name] = new native.database(db.driver, db);
    return true;
  } else {
    throw new Exception('database %s already exists',name);
  }
};

//F: Unregisters a database from current environment.
//A: name: Specifies name of database to unregister.
//R: Returns true if database is successfully unregistered.
platform.database.unregister = function(name){
  if (platform.database.exists(name) === true) {
    return delete platform.database._store[name];
  } else {
    throw new Exception('database %s does not exist',name);
  }
};

//F: Gets a database from current environment.
//A: name: Specifies name of database to get.
//R: Returns database schema instance.
platform.database.get = function(name){
  if (platform.database.exists(name) === true) {
    return platform.database._store[name];
  } else {
    throw new Exception('database %s not found',name);
  }
};

platform.database.list = function(){
  return Object.keys(platform.database._store);
};

//F: Checks whether a database is registered in current environment.
//A: name: Specifies name of database to check.
//R: Returns true if database is registered.
platform.database.exists = function(name){
  return (platform.database._store.hasOwnProperty(name) && platform.database._store[name] != null && platform.database._store[name].constructor === native.database);
};

platform.database._init = function(){
  Object.keys(platform.configuration.server.databases).forEach(function(name){
    platform.database.register(name,platform.configuration.server.databases[name]);
  });
};

//T: call it on platform.ready event?
platform.database._init();
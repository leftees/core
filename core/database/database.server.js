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

/**
 * Stores the registered database schemas.
 * @type {Object}
*/
platform.database._store = platform.database._store || {};

/**
 * Registers a database into current environment.
 * @param {} name Specifies name of new database to register.
 * @param {} db Specifies the settings object for new database schema instance.
 * @return {} Returns true if database is successfully registered.
*/
platform.database.register = async function(name,db){
  if (platform.database.exists(name) === false) {
    switch(db.driver){
      case 'firebird':
        await load('node-firebird');
        break;
      case 'mongodb':
        await load('mongodb');
        break;
      case 'mongoose':
        await load('mongoose');
        break;
      case 'mysql':
      case 'mariadb':
        await load('mysql');
        break;
      case 'couchdb':
      case 'couch':
      case 'nano':
        await load('nano');
        break;
      case 'neo4j':
        await load('neo4j');
        break;
      case 'postgres':
        await load('pg');
        break;
      case 'redis':
        await load('redis');
        await load('hiredis');
        break;
      case 'rethink':
      case 'rethinkdb':
        await load('rethinkdb');
        break;
      case 'riak':
        await load('riak-js');
        break;
      case 'sqlite':
      case 'sqlite3':
        await load('sqlite3');
        await platform.io.create(native.path.dirname(db.database)+native.path.sep);
        db.database = platform.io.map(db.database);
        break;
      case 'tingodb':
        await load('tingodb');
        break;
      default:
        throw new Exception('database connector %s not available',db.driver);
        break;
    }
    platform.database._store[name] = new native.database.Schema(db.driver, db);
    return true;
  } else {
    throw new Exception('database %s already exists',name);
  }
};

/**
 * Unregisters a database from current environment.
 * @param {} name Specifies name of database to unregister.
 * @return {} Returns true if database is successfully unregistered.
*/
platform.database.unregister = function(name){
  if (platform.database.exists(name) === true) {
    return delete platform.database._store[name];
  } else {
    throw new Exception('database %s does not exist',name);
  }
};

/**
 * Gets a database from current environment.
 * @param {} name Specifies name of database to get.
 * @return {} Returns database schema instance.
*/
platform.database.get = function(name){
  console.log(name)
  if (platform.database.exists(name) === true) {
    return platform.database._store[name];
  } else {
    throw new Exception('database %s not found',name);
  }
};

platform.database.list = function(){
  return Object.keys(platform.database._store);
};

/**
 * Checks whether a database is registered in current environment.
 * @param {} name Specifies name of database to check.
 * @return {} Returns true if database is registered.
*/
platform.database.exists = function(name){
  return (platform.database._store.hasOwnProperty(name) && platform.database._store[name] != null && platform.database._store[name].constructor === native.database.Schema);
};

platform.events.attach('core.ready','database.init', async function() {
  await Object.keys(platform.configuration.database.schemas).forEachAwait(async function(name){
    await platform.database.register(name,platform.configuration.database.schemas[name]);
  });
});
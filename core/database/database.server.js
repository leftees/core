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
platform.database.register = async function(name,settings){
  if (platform.database.exists(name) === false) {
    switch(settings.connector){
      case 'memory':
        // http://docs.strongloop.com/display/public/LB/Memory+connector
        settings.connector = 'memory';
        break;
      case 'sqlite':
        // https://github.com/Synerzip/loopback-connector-sqlite
        await load('sqlite3');
        settings.connector = await load('loopback-connector-sqlite');
        settings.file_name = settings.file_name || settings.file;
        delete settings.file;
        break;
      case 'saphana':
        // https://github.com/jensonzhao/loopback-connector-saphana
        await load('hdb');
        settings.connector = await load('loopback-connector-saphana');
        break;
      case 'mongodb':
        // http://docs.strongloop.com/display/public/LB/MongoDB+connector
        // https://github.com/strongloop/loopback-connector-mongodb
        settings.connector = await load('loopback-connector-mongodb');
        break;
      case 'mysql':
        // http://docs.strongloop.com/display/public/LB/MySQL+connector
        // https://github.com/strongloop/loopback-connector-mysql
        settings.connector = await load('loopback-connector-mysql');
        break;
      case 'redis':
        // http://docs.strongloop.com/display/public/LB/Redis+connector
        // https://github.com/strongloop/loopback-connector-redis
        settings.connector = await load('loopback-connector-redis');
        break;
      case 'postgresql':
        // http://docs.strongloop.com/display/public/LB/Oracle+connector
        // https://github.com/strongloop/loopback-connector-oracle
        settings.connector = await load('loopback-connector-postgresql');
      case 'oracle':
        // http://docs.strongloop.com/display/public/LB/PostgreSQL+connector
        // https://github.com/strongloop/loopback-connector-oracle
        settings.connector = await load('loopback-connector-oracle');
      case 'couch':
        // https://github.com/mattange/loopback-connector-couch
        settings.connector = await load('loopback-connector-couch');
        break;
      case 'mssql':
        // http://docs.strongloop.com/display/public/LB/SQL+Server+connector
        // https://github.com/strongloop/loopback-connector-mssql
        settings.connector = await load('loopback-connector-mssql');
        break;
      default:
        throw new Exception('database connector %s not available',settings.driver);
        break;
    }
    settings.name = name;
    platform.database._store[name] = new native.database.DataSource(name,settings);
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
  await Object.keys(platform.configuration.database.sources).forEachAwait(async function(name){
    await platform.database.register(name,platform.configuration.database.sources[name]);
  });
});
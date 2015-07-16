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

platform.configuration.database = {};

platform.configuration.database.sources = {
  // Define settings object that should be passed to ORM schema initialization.
};

platform.configuration.database.sources.accounts = {
  'connector': 'sqlite',
  'file': '/data/db/accounts.db',
  'debug': false
};

/*platform.configuration.database.sources.mymemory = {
  'connector': 'memory',
  'file': '/data/db/mymemory.json'
};*/

/*platform.configuration.database.sources.mysqlite = {
  'connector': 'sqlite',
  'file': '/data/db/mysqlite.db',
  'debug': false
};*/

/*platform.configuration.database.sources.mysaphana = {
  'connector': 'saphana',
  'host': 'localhost',
  'port': 30015,
  'username': '',
  'password': '',
  'debug': false
};*/

/*platform.configuration.database.sources.mymongodb = {
  'connector': 'mongodb',
  'host': 'localhost',
  'port': 27017,
  'database': '',
  'username': '',
  'password': '',
  'url': null,
  'debug': false
};*/

/*platform.configuration.database.sources.mymysql = {
  'connector': 'mysql',
  'host': 'localhost',
  'port': 3306,
  'database': '',
  'username': '',
  'password': '',
  'debug': false
};*/

/*platform.configuration.database.sources.myredis = {
 'connector': 'redis',
 'host': 'localhost',
 'port': 6379,
 'database': '',
 'username': '',
 'password': '',
 'debug': false
 };*/

/*platform.configuration.database.sources.mypostgresql = {
 'connector': 'postgresql',
 'host': '/var/run/postgresql/',
 'port': 5432,
 'database': '',
 'username': '',
 'password': '',
 'debug': false
 };*/

/*platform.configuration.database.sources.myoracle = {
 'connector': 'oracle',
 'host': 'localhost',
 'port': 1521,
 'database': '',
 'username': '',
 'password': ''
};*/

/*platform.configuration.database.sources.mycouch = {
 'connector': 'couch',
 'host': 'localhost',
 'port': 5984,
 'protocol': 'http',
 'auth': {
   'admin': {
     'username': '',
     'password': ''
   }
 }
};*/

/*platform.configuration.database.sources.mymssql = {
 'connector': 'mssql',
 'host': 'localhost',
 'port': 1521,
 'database': '',
 'username': '',
 'password': '',
 'schema': '',
 'debug': false
};*/

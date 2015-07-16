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

platform.accounts = platform.accounts || {};

platform.accounts._init = async function(){
  var database = platform.database.get('accounts');
  database.createModel('Users', {
    'uid': { 'type': Number, 'generated': true, 'id': true },
    'name': String,
    'hashpassword': String,
    'httppassword': String,
    'enable': { 'type': Boolean, 'default': true }
  });
  await database.autoupdate('Users');
  database.createModel('Groups', {
    'gid': { 'type': Number, 'generated': true, 'id': true },
    'name': String,
    'priority': Number,
    'enable': { 'type': Boolean, 'default': true }
  });
  await database.autoupdate('Groups');
  database.createModel('Identities', {
    'iid': { 'type': Number, 'generated': true, 'id': true },
    'type': String,
    'tid': Number
  });
  await database.autoupdate('Identities');
  var defaultGroups = [ 'everyone', 'anonymous', 'services', 'developers', 'administrators', 'sudoers' ];
  var defaultGroupsPriorities = [ 1, 2, 1001, 1002, 1003, 1004 ];
  await defaultGroups.forEachAwaitSeries(async function(group, index){
    await database.models.Groups.findOrCreate({
      'where': { 'name': group }
    },{
      'name': group,
      'priority': defaultGroupsPriorities[index]
    });
  });
};

platform.events.attach('core.ready','accounts.init', async function() {
  await platform.accounts._init();
});
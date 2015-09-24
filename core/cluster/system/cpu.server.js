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

/**
 * Contains cluster namespace with related objects and methods.
 * @namespace
*/
platform.cluster = platform.cluster || {};

/**
 * Contains cluster system namespace.
 * @namespace
*/
platform.cluster.system = platform.cluster.system || {};

platform.cluster.system.cpu = platform.cluster.system.cpu || {};

if (process.platform !== 'win32') {

  platform.cluster.system.cpu.info = async function () {
    // requesting json to statistics node within the cluster
    var results = await platform.cluster.kernel.invoke('*', 'platform.system.cpu.info');

    if (results != null && results.succeed.length === results.destinations.length) {
      //var result = await platform.system.cpu.info();
      var result = {
        'total': 0,
        'user': 0,
        'system': 0
      };

      results.forEach(function (remote_result) {
        if (remote_result != null) {
          result.total += remote_result.total;
          result.user += remote_result.user;
          result.system += remote_result.system;
        }
      });

      return result;
    } else {
      return null;
    }
  };

  platform.events.attach('core.ready', 'cluster.cpu.init', async function () {
    await platform.cluster.statistics.register('gauge', 'cpu.total' ,'%', null, true);
    await platform.cluster.statistics.register('gauge', 'cpu.user','%', null, true);
    await platform.cluster.statistics.register('gauge', 'cpu.system','%', null, true);
  });

} else {

}
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

platform.cluster.system.uv = platform.cluster.system.uv || {};

platform.cluster.system.uv.info = async function(){
  // requesting json to statistics node within the cluster
  var results = await platform.cluster.kernel.invoke('*','platform.system.uv.info');

  if (results != null && results.succeed.length === results.destinations.length) {
    //var result = platform.system.uv.info();
    var result = {
      'current': 0,
      'average': 0,
      'peak': 0
    };

    results.forEach(function (remote_result) {
      if (remote_result != null) {
        result.current += remote_result.current;
        result.average += remote_result.average;
        result.peak += remote_result.peak;
      }
    });

    return result;
  } else {
    return null;
  }
};

platform.events.attach('core.ready','cluster.uv.init', async function(){
  await platform.cluster.statistics.register('gauge', 'uv.latency.current',null,true);
  await platform.cluster.statistics.register('gauge', 'uv.latency.average',null,true);
  await platform.cluster.statistics.register('gauge', 'uv.latency.peak',null,true);
});

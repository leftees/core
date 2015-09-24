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

//TODO: add autostart support in configuration
/**
 * Provides support for memory monitoring and management (based on memwatch).
 * @type {Object}
*/
platform.cluster.system.memory = platform.cluster.system.memory || {};

/**
 * Demands a cluster V8 runtime garbage collection.
*/
platform.cluster.system.memory.collect = async function(){
  // print memory info before collecting
  if (platform.configuration.debug.memory === true) {
    await platform.cluster.system.memory.log(true,true);
  }
  // calculating time and executing garbage collector
  var time_start = Date.now();
  await platform.cluster.kernel.invoke('*','native.memwatch.gc');
  //platform.system.memory._memwatch.gc();
  var time_stop = Date.now();
  // logging
  if (platform.configuration.debug.memory === true) {
    console.debug('cluster memory garbage collected in %s',Number.toHumanTime(time_stop-time_start));
    await platform.cluster.system.memory.log(true,true);
  }
  return platform.cluster.system.memory.info();
};

/**
 * Gets cluster V8 memory and heap information.
*/
platform.cluster.system.memory.info = async function(){
  // requesting json to statistics node within the cluster
  var results = await platform.cluster.kernel.invoke('*','platform.system.memory.info');

  if (results != null && results.succeed.length === results.destinations.length) {
    //var result = platform.system.memory.info();
    //delete result.trend;
    var result = {
      'heap': 0,
      'rss': 0
    };

    results.forEach(function (remote_result) {
      if (remote_result != null) {
        result.heap += remote_result.heap;
        result.rss += remote_result.rss;
      }
    });

    return result;
  } else {
    return null;
  }
};

/**
 * Prints cluster V8 runtime memory usage.
 * @param {} [force] Specifies to print info even if nothing has changed from last log. Default is false.
*/
platform.cluster.system.memory.log = async function(force){
  // extracting memory usage data
  var memory_info = await platform.cluster.system.memory.info();

  if(memory_info == null) {
    console.warn('cluster memory status is unavailable');
    return;
  }

  // calculating memory usage and converting to human-readable strings
  var heap_label = Number.toHumanSize(memory_info.heap);
  var rss_label = Number.toHumanSize(memory_info.rss);

  // printing memory info only if label has changed from last time or we're forced to do so
  if (force === true || heap_label !== platform.cluster.system.memory._previous.heap_label || rss_label !== platform.cluster.system.memory._previous.rss_label) {
    console.debug('cluster memory status is %s ram with %s heap', rss_label, heap_label);
  }
};

platform.events.attach('core.ready','cluster.memory.init', async function(){
  await platform.cluster.statistics.register('gauge', 'memory.heap','bytes',null,true);
  await platform.cluster.statistics.register('gauge', 'memory.rss','bytes',null,true);
});

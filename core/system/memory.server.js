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
 * Contains system namespace.
 * @namespace
*/
platform.system = platform.system || {};

//TODO: add autostart support in configuration
/**
 * Provides support for memory monitoring and management (based on memwatch).
 * @type {Object}
*/
platform.system.memory = platform.system.memory || {};

/**
 * Demands a V8 runtime garbage collection.
*/
platform.system.memory.collect = function(){
  // print memory info before collecting
  if (platform.configuration.debug.memory === true) {
    platform.system.memory.log(true,true);
  }
  // calculating time and executing garbage collector
  var time_start = Date.now();
  native.memwatch.gc();
  var time_stop = Date.now();
  // logging
  if (platform.configuration.debug.memory === true) {
    console.debug('memory garbage collected in %s',Number.toHumanTime(time_stop-time_start));
    platform.system.memory.log(true,true);
  }
  return platform.system.memory.info();
};

/**
 * Stores memory data for trend analysis.
 * @type {Object}
*/
platform.system.memory._previous = {};
platform.system.memory._previous.heap = 0;
platform.system.memory._previous.rss = 0;
platform.system.memory._previous.heap_label = null;
platform.system.memory._previous.rss_label = null;

/**
 * Gets V8 memory and heap information.
*/
platform.system.memory.info = function(){
  // extracting memory usage data
  var memory = process.memoryUsage();

  // calculating memory usage trend
  var trend_heap = Math.floor((memory.heapTotal-platform.system.memory._previous.heap)/platform.system.memory._previous.heap*10000)/100;
  var trend_rss = Math.floor((memory.rss-platform.system.memory._previous.rss)/platform.system.memory._previous.rss*10000)/100;

  return {
    'heap': memory.heapTotal,
    'rss': memory.rss,
    'trend': {
      'heap': trend_heap,
      'rss': trend_rss
    }
  };
};

/**
 * Prints V8 runtime memory usage.
 * @param {} [force] Specifies to print info even if nothing has changed from last log. Default is false.
 * @param {} [rebase]:
*/
platform.system.memory.log = function(force,rebase){
  // extracting memory usage data
  var memory_info = platform.system.memory.info();

  // calculating memory usage trend and converting to human-readable strings
  var trend_heap = memory_info.trend.heap;
  var trend_rss = memory_info.trend.rss;
  var trend_heap_label;
  if (trend_heap === Infinity) {
    trend_heap_label = ' (n/a)';
  } else if (trend_heap === 0) {
    trend_heap_label = '';
  } else {
    trend_heap_label = ' (' + ((trend_heap > 0) ? '+' + trend_heap : trend_heap) + '%)';
  }
  var trend_rss_label;
  if (trend_rss === Infinity) {
    trend_rss_label = ' (n/a)';
  } else if (trend_rss === 0) {
    trend_rss_label = '';
  } else {
    trend_rss_label = ' (' + ((trend_rss > 0) ? '+' + trend_rss : trend_rss) + '%)';
  }
  var heap_label = Number.toHumanSize(memory_info.heap);
  var rss_label = Number.toHumanSize(memory_info.rss);

  // printing memory info only if label has changed from last time or we're forced to do so
  if (force === true || heap_label !== platform.system.memory._previous.heap_label || rss_label !== platform.system.memory._previous.rss_label) {
    console.debug('memory status is %s ram%s with %s heap%s', rss_label, trend_rss_label, heap_label, trend_heap_label);
  }

  // storing memory data for further trend analysis
  if(rebase === true) {
    platform.system.memory._previous.heap = memory_info.heap;
    platform.system.memory._previous.rss = memory_info.rss;
  }

  // storing latest label
  platform.system.memory._previous.heap_label = heap_label;
  platform.system.memory._previous.rss_label = rss_label;
};

platform.events.attach('core.ready','memory.init',function(){
  if (platform.configuration.system.memory.gc.force === true) {
    // forcing garbage collector to clean memory
    platform.system.memory.collect();
    // starting forced gc interval if requested by configuration
    platform.system.memory._interval = setInterval(platform.system.memory.collect, platform.configuration.system.memory.gc.interval);
  }
  // attaching to memwatch leak event
  platform.events.register('memory.leak',null,null,true);
  native.memwatch.on('leak', /*#name('memwatch.on.info'):*/function (info) {
    if (platform.configuration.debug.memory === true) {
      console.warn('possible memory leak detected: %s', info.reason);
    }
    platform.events.raise('memory.leak', info);
  });
  // attaching to memwatch stats event
  native.memwatch.on('stats', /*#name('memwatch.on.stats'):*/function (stats) {
    if (platform.configuration.debug.memory === true) {
      platform.system.memory.log();
    }
    if (platform.configuration.system.memory.gc.force === true) {
      // forcing garbage collector to clean memory
      platform.system.memory.collect();
    }
  });
  platform.statistics.register('gauge', 'memory.heap','bytes',null,true);
  platform.statistics.register('gauge', 'memory.rss','bytes',null,true);
  setInterval(function(){
    var memory_info = process.memoryUsage();
    platform.statistics.get('memory.heap').set(memory_info.heapTotal);
    platform.statistics.get('memory.rss').set(memory_info.rss);
  },1000);
});
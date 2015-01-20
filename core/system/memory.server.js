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

platform.system = platform.system || {};

//T: add autostart support in configuration
//O: Provides support for memory monitoring and management (based on memwatch).
platform.system.memory = {};
platform.system.memory._memwatch = require('memwatch');

//V: Contains HeapDiff class instance during heap diff analysis.
platform.system.memory._heapdiff = null;

//F: Starts memory heap diff analysis.
platform.system.memory.start = function(){
  platform.system.memory._heapdiff = new platform.system.memory._memwatch.HeapDiff();
};

//F: Stops memory heap and returns diff analysis.
//R: Returns head diff object from memwatch module.
platform.system.memory.stop = function(){
  var heapdiff = platform.system.memory._heapdiff;
  platform.system.memory._heapdiff = null;
  return heapdiff.end();
};

//F: Demands a V8 runtime garbage collection.
platform.system.memory.collect = function(){
  if (platform.configuration.server.debugging.memory === true) {
    platform.system.memory.log(true,false);
  }
  var time_start = Date.now();
  platform.system.memory._memwatch.gc();
  var time_stop = Date.now();
  if (platform.configuration.server.debugging.memory === true) {
    console.debug('memory garbage collected in %s',Number.toHumanTime(time_stop-time_start));
    platform.system.memory.log(true,true);
  }
};

//O: Stores memory data for trend analysis.
platform.system.memory._previous = {};
platform.system.memory._previous.heap = 0;
platform.system.memory._previous.rss = 0;
platform.system.memory._previous.heap_label = null;
platform.system.memory._previous.rss_label = null;

platform.system.memory.info = function(){
  //C: extracting memory usage data
  var memory = process.memoryUsage();

  //C: calculating memory usage trend
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

//F: Prints V8 runtime memory usage.
//A: [always]: Specifies to print info even if nothing has changed from last log. Default is false.
platform.system.memory.log = function(always,rebase){
  //C: extracting memory usage data
  var memory_info = platform.system.memory.info();

  //C: calculating memory usage trend
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

  if (always === true || heap_label !== platform.system.memory._previous.heap_label || rss_label !== platform.system.memory._previous.rss_label) {
    console.debug('memory status is %s ram%s with %s heap%s', rss_label, trend_rss_label, heap_label, trend_heap_label);
  }

  if(rebase === true) {
    //C: storing memory data for further trend analysis
    platform.system.memory._previous.heap = memory_info.heap;
    platform.system.memory._previous.rss = memory_info.rss;
  }

  platform.system.memory._previous.heap_label = heap_label;
  platform.system.memory._previous.rss_label = rss_label;
};

//C: starting memory watcher (only if debug is enabled)
//T: add platform event for memory leak/stats
//C: attaching to memwatch leak event
platform.system.memory._memwatch.on('leak', #name('memwatch.on.info'):function (info) {
  //T: investigate negative memory leaks?
  //console.warn('possible memory leak detected: %s', info.reason);
});
//C: attaching to memwatch stats event
platform.system.memory._memwatch.on('stats', #name('memwatch.on.stats'):function (stats) {
  if (platform.configuration.server.debugging.memory === true) {
    platform.system.memory.log();
  }
});

//C: starting forced gc interval if requested by configuration
if (platform.configuration.server.memory.gc.force === true) {
  platform.system.memory._interval = setInterval(platform.system.memory.collect, platform.configuration.server.memory.gc.interval);
}
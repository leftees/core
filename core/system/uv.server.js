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

var _resolution = 100;
var _rate = 1000;
var _poller = native.monitor.uv(_resolution);
var _average = 0;
var _peak = 0;
var _sum = 0;
var _count = 0;
var _time = Date.now();

setInterval(function(){
  var _current = _poller();
  _sum += _current;
  if (_current > _peak){
    _peak = _current;
  }
  ++_count;
  var now = Date.now();
  var elapsed = now - _time;
  if (elapsed>=_rate) {
    _average = _sum / _count;
    _time = now;
    _sum = 0;
    _count = 0;
    _peak = 0;
  }
},_resolution);

platform.system.uv = platform.system.uv || {};

platform.system.uv.info = function(){
  return {
    'current': _poller(),
    'average': _average,
    'peak': _peak
  };
};

platform.events.attach('core.ready','uv.init',function() {
  platform.statistics.register('gauge', 'uv.latency.current',null,true);
  platform.statistics.register('gauge', 'uv.latency.average',null,true);
  platform.statistics.register('gauge', 'uv.latency.peak',null,true);
  setInterval(function () {
    platform.statistics.get('uv.latency.current').set(_poller());
    platform.statistics.get('uv.latency.average').set(_average);
    platform.statistics.get('uv.latency.peak').set(_peak);
  }, 1000);
});
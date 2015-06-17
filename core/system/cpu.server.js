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

platform.system.cpu = platform.system.cpu || {};

var _total = 0;
var _user = 0;
var _system = 0;
var _resolution = 1000;

if (process.platform !== 'win32') {

  var STAT_INDEXES = {
    STIME: 11,
    UTIME: 12
  };

  var _last_stime = 0;
  var _last_utime = 0;
  var _time = 0;
  var _clock = native.sysconf(native.sysconf._SC_CLK_TCK);

  var _get_time_supported = {};

  _get_time_supported.linux = function () {
    var data, stat_data;
    data = native.fs.readFileSync('/proc/' + process.pid + '/stat', {'encoding': 'utf8'});
    stat_data = data.substr(data.lastIndexOf(')') + 2).split(' ');
    return {
      'stime': parseFloat(stat_data[STAT_INDEXES.STIME]),
      'utime': parseFloat(stat_data[STAT_INDEXES.UTIME])
    };
  };

  _get_time_supported.darwin = function () {
    var data, line_data, stat_data;
    data = native.child.execSync('ps -o "stime,utime" -p ' + process.pid, {'encoding': 'utf8'});
    line_data = data.trim().split('\n');
    if (line_data.length !== 2) {
      return {
        'stime': -1,
        'utime': -1
      };
    }
    stat_data = line_data[1].match(_get_time_supported.darwin.matcher);
    return {
      'stime': (parseInt(stat_data[1]) * 60 + parseInt(stat_data[2]) + parseInt(stat_data[3]) / 100) * _clock,
      'utime': (parseInt(stat_data[4]) * 60 + parseInt(stat_data[5]) + parseInt(stat_data[6]) / 100) * _clock
    };
  };
  _get_time_supported.darwin.matcher = /[ ]*([0-9]*):([0-9]*)\.([0-9]*)[ ]*([0-9]*):([0-9]*)\.([0-9]*)[ ]*/;

  _get_time_supported.unsupported = function (callback) {
    return {
      'stime': -1,
      'utime': -1
    };
  };

  var _get_time = _get_time_supported[process.platform] || _get_time_supported.unsupported;

  setInterval(function () {
    try {
      var stat = _get_time();
      var now = Date.now();
      var stime = stat.stime;
      var utime = stat.utime;
      if (stime === -1 && utime === -1) {
        _user = -1;
        _system = -1;
        _total = -1;
      } else {
        var d_stime = stime - _last_stime;
        var d_utime = utime - _last_utime;
        var d_time = (now - _time) / 1000;
        _user = (100 * (d_utime / _clock) / d_time);
        _system = 100 * (d_stime / _clock) / d_time;
        _total = _user + _system;
        _last_stime = stime;
        _last_utime = utime;
        _time = now;
      }
    } catch (e) {}
  }, _resolution);

} else {

  var processor_pc = new native.perfcounter('\\Process('+process.name+')\\% Processor Time');
  var user_pc = new native.perfcounter('\\Process('+process.name+')\\% User Time');
  var privileged_pc = new native.perfcounter('\\Process('+process.name+')\\% Privileged Time');

  setInterval(function () {
    try {
      _total = processor_pc.fnGetValue();
    } catch(ex){}
    try {
      _user = user_pc.fnGetValue();
    } catch(ex){}
    try {
      _system = privileged_pc.fnGetValue();
    } catch(ex){}
  }, _resolution);
}

platform.system.cpu.info = function () {
  return {
    'total': _total,
    'user': _user,
    'system': _system
  };
};

platform.events.attach('core.ready', 'cpu.init', function () {
  platform.statistics.register('gauge', 'cpu.total', null, true);
  platform.statistics.register('gauge', 'cpu.user', null, true);
  platform.statistics.register('gauge', 'cpu.system', null, true);
  setInterval(function () {
    platform.statistics.get('cpu.total').set(_total);
    platform.statistics.get('cpu.user').set(_user);
    platform.statistics.get('cpu.system').set(_system);
  }, 1000);
});
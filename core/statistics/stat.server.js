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

//TODO: implement abstract interface to allow further multiple/different backend support
/**
 * Provides statistics methods to create and collect performance counters.
 * @namespace
*/
platform.statistics = platform.statistics || {};

/**
 *  Stores the metrics instances by name.
*/
platform.statistics._store = platform.statistics._store || {};

var _meters = [];

var _interval = null;

//TODO: push to configuration the timer resolution
var _resolution = 1000;

//TODO: define standard specification for names (e.g. http.request.active)
platform.statistics.register = function(type,name,unit,options,force){
  // checking whether a metric with same name has been registered
  if (platform.statistics.exists(name) === false) {
    //TODO: check if every method is implemented (interface?)
    // storing metric instance
    switch(type){
      case 'counter':
        platform.statistics._store[name] = new Counter(options);
        break;
      case 'meter':
        var meter = new Meter(options);
        platform.statistics._store[name] = meter;
        _meters.push(meter);
        break;
      case 'gauge':
        platform.statistics._store[name] = new Gauge(options);
        break;
        //TODO: implement histograms and timers?
      default:
        throw new Exception('metric of type %s is not supported',type);
        return false;
    }
    // extending with type/name
    platform.statistics._store[name].type = type;
    platform.statistics._store[name].name = name;
    platform.statistics._store[name].unit = unit;


    //TODO: get value persistent across restart from storage

    return true;
  } else if (force === true && platform.statistics._store[name].type === type) {
    //TODO: merge options
    platform.statistics._store[name].unit = unit || platform.statistics._store[name].unit;
  } else {
    throw new Exception('metric %s already exists with type %s',name,type);
  }
};

platform.statistics.unregister = function(name){
  // checking if metric exists
  if (platform.statistics.exists(name) === true) {
    // removing meter if any
    if (platform.statistics._store[name].type === 'meter') {
      var meter_obj_index = _meters.indexOf(platform.statistics._store[name]);
      if (meter_obj_index !== -1) {
        _meters.splice(meter_obj_index, 1);
      }
    }
    // deleting metric object
    return delete platform.statistics._store[name];
  } else {
    throw new Exception('metric %s does not exist',name);
  }
};

platform.statistics.exists = function(name){
  return (platform.statistics._store.hasOwnProperty(name));
};

platform.statistics.list = function(){
  var result = [];
  // adding backend objects to results by name
  Object.keys(platform.statistics._store).forEach(function(name){
    result.push(name);
  });
  return result;
};

platform.statistics.get = function(name){
  // checking whether metrics exists and returning its instance
  if (platform.statistics.exists(name) === true) {
    return platform.statistics._store[name];
  } else {
    throw new Exception('metric %s not found', name);
  }
};

platform.statistics.toJSON = function(name){
  if (name == null) {
    var result = {};
    Object.keys(platform.statistics._store).forEach(function (name) {
      var metric = platform.statistics._store[name];
      result[name] = metric.toJSON();
    });
    return result;
  } else {
    // checking whether metrics exists and returning its instance
    if (platform.statistics.exists(name) === true) {
      return platform.statistics._store[name].toJSON();
    } else {
      return undefined;
    }
  }
};

var Counter = function(options){
  this._count = 0;
  this._min = 0;
  this._max = 0;
  if (options != null && typeof options.count === 'number'){
    this.reset(options.count);
  }
  //TODO: should be persistent throughout restarts
};

Counter.prototype.inc = function(value) {
  this._count += (value || 1);
  if (this._count > this._max){
    this._max = this._count;
  }
};

Counter.prototype.dec = function(value) {
  this._count -= (value || 1);
  if (this._count < this._min){
    this._min = this._count;
  }
};

Counter.prototype.reset = function(value) {
  this._count = (value || 0);
  if (this._count < this._min){
    this._min = this._count;
  }
  if (this._count > this._max){
    this._max = this._count;
  }
};

Counter.prototype.toJSON = function(){
  return {
    'value': this._count,
    'min': this._min,
    'max': this._max,
    'unit': this.unit
  };
};

var Meter = function(options){
  this.reset(options);
};

Meter.prototype.mark = function(value){
  this._count += (value || 1);
};

Meter.prototype.reset = function(options){
  if (options != null && typeof options.rate === 'number'){
    this._rate = options.rate;
  } else {
    this._rate = 1000;
  }
  if (options != null && typeof options.count === 'number'){
    this._count = options.count;
  } else {
    this._count = 0;
  }
  this._value = 0;
  this._min = 0;
  this._max = 0;
  this._time = Date.now();
};

Meter.prototype.toJSON = function(){
  return {
    'value': this._value,
    'min': this._min,
    'max': this._max,
    'unit': this.unit
  };
};


var Gauge = function(options){
  this._value = 0;
  this._min = 0;
  this._max = 0;
  if (options != null && typeof options.value === 'number'){
    this.set(options.value);
  }
  //TODO: should be persistent throughout restarts
};

Gauge.prototype.set = function(value){
  this._value = value;
  if (this._value < this._min){
    this._min = this._value;
  }
  if (this._value > this._max){
    this._max = this._value;
  }
};

Gauge.prototype.toJSON = function(){
  return {
    'value': this._value,
    'min': this._min,
    'max': this._max,
    'unit': this.unit
  };
};

_interval = setInterval(function(){
  var now = Date.now();
  _meters.forEach(function(meter){
    var elapsed = now - meter._time;
    if (elapsed>=meter._rate){
      meter._value = (meter._count / elapsed) * meter._rate;
      if (meter._value < meter._min){
        meter._min = meter._value;
      }
      if (meter._value > meter._max){
        meter._max = meter._value;
      }
      meter._time = now;
      meter._count = 0;
    }
  });
},_resolution);

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

//T: implement abstract interface to allow further multiple/different backend support
//N: Provides statistics methods to create and collect performance counters (currently using 'measured' external module)
//H: Please visit https://github.com/felixge/node-measured for how-tos and usage information.
platform.statistics = platform.statistics || {};

//V: Stores the metrics instances by name.
var _store = {};

var _meters = [];

var _interval = null;

//T: push to configuration the timer resolution
var _resolution = 1000;

//T: define standard specification for names (e.g. http.request.active)
platform.statistics.register = function(type,name,options){
  //C: checking whether a metric with same name has been registered
  if (platform.statistics.exist(name) === true && platform.statistics.get(name).type !== type) {
    throw new Exception('metric %s already exists with type %s',name,type);
  } else {
    //T: check if every method is implemented (interface?)
    //C: storing metric instance
    switch(type){
      case 'counter':
        _store[name] = new Counter(options);
        break;
      case 'meter':
        var meter = new Meter(options);
        _store[name] = meter;
        _meters.push(meter);
        break;
      case 'gauge':
        _store[name] = new Gauge(options);
        break;
      //T: implement histograms and timers?
      default:
        throw new Exception('metric of type %s is not supported',type);
        return false;
    }
    //C: extending with type/name
    _store[name].type = type;
    _store[name].name = name;

    //T: get value persistent across restart from storage

    return true;
  }
};

platform.statistics.unregister = function(name){
  //C: checking if metric exists
  if (_store.exist(name) === true) {
    //C: deleting metric object
    return delete _store[name];
  } else {
    throw new Exception('metric %s does not exist',name);
  }
};

platform.statistics.exist = function(name){
  return (_store.hasOwnProperty(name));
};

platform.statistics.list = function(){
  var result = [];
  //C: adding backend objects to results by name
  Object.keys(_store).forEach(function(name){
    result.push(name);
  });
  return result;
};

platform.statistics.get = function(name){
  //C: checking whether metrics exists and returning its instance
  if (platform.statistics.exist(name) === true) {
    return _store[name];
  } else {
    throw new Exception('metric %s not found', name);
  }
};

platform.statistics.toJSON = function(name,callback){
  if (typeof name === 'function'){
    callback = name;
    name = null;
  }
  if (name == null) {
    var result = {};
    if (typeof callback !== 'function') {
      Object.keys(_store).forEach(function (name) {
        var metric = _store[name];
        result[name] = metric.toJSON();
        result[name].type = metric.type;
      });
      return result;
    } else {
      var tasks = [];
      Object.keys(_store).forEach(function (name) {
        var metric = _store[name];
        tasks.push(function(task_callback) {
          metric.toJSON(function(err,task_result) {
            if (err) {
              task_callback(err);
            } else {
              result[name] = task_result;
              task_callback();
            }
          });
        });
      });
      native.async.parallel(tasks,function(err){
        if(err){
          callback(err);
        } else {
          callback(null,result);
        }
      });
    }
  } else {
    if (typeof callback !== 'function') {
      //C: checking whether metrics exists and returning its instance
      if (platform.statistics.exist(name) === true) {
        return _store[name].toJSON();
      } else {
        throw new Exception('metric %s not found', name);
      }
    } else {
      //C: checking whether metrics exists and returning its instance
      if (platform.statistics.exist(name) === true) {
        _store[name].toJSON(callback);
      } else {
        callback(new Exception('metric %s not found', name));
      }
    }
  }
};

var Counter = function(options){
  this._count = 0;
  if (options != null && typeof options.count === 'number'){
    this._count = options.count;
  }
  //T: should be persistent throughout restarts
};

Counter.prototype.inc = function(value) {
  this._count += (value || 1);
};

Counter.prototype.dec = function(value) {
  this._count -= (value || 1);
};

Counter.prototype.reset = function(value) {
  this._count = (value || 0);
};

Counter.prototype.toJSON = function(callback){
  var result = {
    'count': this._count
  };
  if (typeof callback !== 'function'){
    return result;
  } else {
    process.nextTick(function(){
      callback(null,result);
    });
  }
  return null;
};

var Meter = function(options){
  Meter.prototype.reset.apply(this,arguments);
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
  this._time = Date.now();
};

Meter.prototype.toJSON = function(callback){
  var result = {
    'value': this._value,
    'rate': this._rate
  };
  if (typeof callback !== 'function'){
    return result;
  } else {
    process.nextTick(function(){
      callback(null,result);
    });
  }
  return null;
};


var Gauge = function(options){
  this._value = 0;
  if (options != null && typeof options.value === 'number'){
    this._value = options.value;
  }
  //T: should be persistent throughout restarts
};

Gauge.prototype.set = function(value){
  this._value = value;
};

Gauge.prototype.toJSON = function(callback){
  var result = {
    'value': this._value
  };
  if (typeof callback !== 'function'){
    return result;
  } else {
    process.nextTick(function(){
      callback(null,result);
    });
  }
  return null;
};

//T: execute on platform.ready event?
_interval = setInterval(function(){
  var now = Date.now();
  _meters.forEach(function(meter){
    var elapsed = now - meter._time;
    if (elapsed>=meter._rate){
      meter._value = (meter._count / elapsed) * meter._rate;
      meter._time = now;
      meter._count = 0;
    }
  });
},_resolution);
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

//TODO: implement Array.prototype.reduce, Array.prototype.reduceRight and Array.prototype.sort

Array.prototype.forEachAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false) {
        argCallback(current, index, array).then(function (task_result) {
          task_callback();
        }, function (task_error) {
          error = true;
          task_callback();
          callback.reject(task_error);
        });
      }
    });
  });
  native.async.parallel(tasks,function(){
    if (error === false) {
      callback.resolve(undefined);
    }
  });

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'forEachAwait', { 'enumerable': false });

Array.prototype.forEachAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false) {
        argCallback(current, index, array).then(function (task_result) {
          task_callback();
        }, function (task_error) {
          error = true;
          task_callback();
          callback.reject(task_error);
        });
      }
    });
  });
  native.async.series(tasks,function(){
    if (error === false) {
      callback.resolve(undefined);
    }
  });

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'forEachAwaitSeries', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.everyAwait =
Uint8Array.prototype.everyAwait =
Uint8ClampedArray.prototype.everyAwait =
Int16Array.prototype.everyAwait =
Uint16Array.prototype.everyAwait =
Int32Array.prototype.everyAwait =
Uint32Array.prototype.everyAwait =
Float32Array.prototype.everyAwait =
Float64Array.prototype.everyAwait =
Array.prototype.everyAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = true;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === true) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === false){
            result = false;
          }
          callback.resolve(false);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.parallel(tasks,function(errors,results){
    if (error === false && result === true) {
      callback.resolve(true);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'everyAwait', { 'enumerable': false });
Object.defineProperty(Array.prototype,'everyAwait', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.everyAwaitSeries =
Uint8Array.prototype.everyAwaitSeries =
Uint8ClampedArray.prototype.everyAwaitSeries =
Int16Array.prototype.everyAwaitSeries =
Uint16Array.prototype.everyAwaitSeries =
Int32Array.prototype.everyAwaitSeries =
Uint32Array.prototype.everyAwaitSeries =
Float32Array.prototype.everyAwaitSeries =
Float64Array.prototype.everyAwaitSeries =
Array.prototype.everyAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = true;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === true) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === false){
            result = false;
          }
          callback.resolve(false);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.series(tasks,function(errors,results){
    if (error === false && result === true) {
      callback.resolve(true);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'everyAwaitSeries', { 'enumerable': false });
Object.defineProperty(Array.prototype,'everyAwaitSeries', { 'enumerable': false });

//TODO: exit at first false return
Array.prototype.filterAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var none = {};
  var result = [];
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result[index] = current;
          } else {
            result[index] = none;
          }
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.parallel(tasks,function(errors,results){
    if (error === false) {
      result.filter(function(current){
        return (current != none);
      });
      callback.resolve(result);
    }
  });

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'filterAwait', { 'enumerable': false });

//TODO: exit at first false return
Array.prototype.filterAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var none = {};
  var result = [];
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result[index] = current;
          } else {
            result[index] = none;
          }
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.series(tasks,function(errors,results){
    if (error === false) {
      result.filter(function(current){
        return (current != none);
      });
      callback.resolve(result);
    }
  });

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'filterAwaitSeries', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.findAwait =
Uint8Array.prototype.findAwait =
Uint8ClampedArray.prototype.findAwait =
Int16Array.prototype.findAwait =
Uint16Array.prototype.findAwait =
Int32Array.prototype.findAwait =
Uint32Array.prototype.findAwait =
Float32Array.prototype.findAwait =
Float64Array.prototype.findAwait =
Array.prototype.findAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = undefined;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === undefined) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result = current;
          }
          callback.resolve(current);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.parallel(tasks,function(errors,results){
    if (error === false && result === undefined) {
      callback.resolve(undefined);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'findAwait', { 'enumerable': false });
Object.defineProperty(Array.prototype,'findAwait', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.findAwaitSeries =
Uint8Array.prototype.findAwaitSeries =
Uint8ClampedArray.prototype.findAwaitSeries =
Int16Array.prototype.findAwaitSeries =
Uint16Array.prototype.findAwaitSeries =
Int32Array.prototype.findAwaitSeries =
Uint32Array.prototype.findAwaitSeries =
Float32Array.prototype.findAwaitSeries =
Float64Array.prototype.findAwaitSeries =
Array.prototype.findAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = undefined;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === undefined) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result = current;
          }
          callback.resolve(current);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.series(tasks,function(errors,results){
    if (error === false && result === undefined) {
      callback.resolve(undefined);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'findAwaitSeries', { 'enumerable': false });
Object.defineProperty(Array.prototype,'findAwaitSeries', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.findIndexAwait =
Uint8Array.prototype.findIndexAwait =
Uint8ClampedArray.prototype.findIndexAwait =
Int16Array.prototype.findIndexAwait =
Uint16Array.prototype.findIndexAwait =
Int32Array.prototype.findIndexAwait =
Uint32Array.prototype.findIndexAwait =
Float32Array.prototype.findIndexAwait =
Float64Array.prototype.findIndexAwait =
Array.prototype.findIndexAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = -1;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === -1) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result = index;
          }
          callback.resolve(index);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.parallel(tasks,function(errors,results){
    if (error === false && result === -1) {
      callback.resolve(-1);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'findIndexAwait', { 'enumerable': false });
Object.defineProperty(Array.prototype,'findIndexAwait', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.findIndexAwaitSeries =
Uint8Array.prototype.findIndexAwaitSeries =
Uint8ClampedArray.prototype.findIndexAwaitSeries =
Int16Array.prototype.findIndexAwaitSeries =
Uint16Array.prototype.findIndexAwaitSeries =
Int32Array.prototype.findIndexAwaitSeries =
Uint32Array.prototype.findIndexAwaitSeries =
Float32Array.prototype.findIndexAwaitSeries =
Float64Array.prototype.findIndexAwaitSeries =
Array.prototype.findIndexAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = -1;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === -1) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result = index;
          }
          callback.resolve(index);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.series(tasks,function(errors,results){
    if (error === false && result === -1) {
      callback.resolve(-1);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });
Object.defineProperty(Array.prototype,'findIndexAwaitSeries', { 'enumerable': false });

//TODO: exit at first false return
Array.prototype.mapAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = [];
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false) {
        argCallback(current, index, array).then(function (task_result) {
          result[index] = task_result;
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.parallel(tasks,function(errors,results){
    if (error === false) {
      callback.resolve(result);
    }
  });

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'mapAwait', { 'enumerable': false });

//TODO: exit at first false return
Array.prototype.mapAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = [];
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false) {
        argCallback(current, index, array).then(function (task_result) {
          result[index] = task_result;
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.series(tasks,function(errors,results){
    if (error === false) {
      callback.resolve(result);
    }
  });

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'mapAwaitSeries', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.someAwait =
Uint8Array.prototype.someAwait =
Uint8ClampedArray.prototype.someAwait =
Int16Array.prototype.someAwait =
Uint16Array.prototype.someAwait =
Int32Array.prototype.someAwait =
Uint32Array.prototype.someAwait =
Float32Array.prototype.someAwait =
Float64Array.prototype.someAwait =
Array.prototype.someAwait = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = false;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === false) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result = true;
          }
          callback.resolve(true);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.parallel(tasks,function(errors,results){
    if (error === false && result === false) {
      callback.resolve(false);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'someAwait', { 'enumerable': false });
Object.defineProperty(Array.prototype,'someAwait', { 'enumerable': false });

//TODO: exit at first false return
Int8Array.prototype.someAwaitSeries =
Uint8Array.prototype.someAwaitSeries =
Uint8ClampedArray.prototype.someAwaitSeries =
Int16Array.prototype.someAwaitSeries =
Uint16Array.prototype.someAwaitSeries =
Int32Array.prototype.someAwaitSeries =
Uint32Array.prototype.someAwaitSeries =
Float32Array.prototype.someAwaitSeries =
Float64Array.prototype.someAwaitSeries =
Array.prototype.someAwaitSeries = function(argCallback, thisArg, callback){
  // normalizing arguments
  if (callback == null && typeof thisArg === 'function'){
    callback = thisArg;
    thisArg = null;
  }

  var collection = thisArg||this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var result = false;
  var error = false;
  var tasks = [];
  collection.forEach(function (current,index,array) {
    tasks.push(function(task_callback) {
      if (error === false && result === false) {
        argCallback(current, index, array).then(function (task_result) {
          if (task_result === true){
            result = true;
          }
          callback.resolve(true);
          task_callback();
        }, function(task_error){
          error = true;
          callback.reject(task_error);
          task_callback();
        });
      }
    });
  });
  native.async.series(tasks,function(errors,results){
    if (error === false && result === false) {
      callback.resolve(false);
    }
  });

  return callback.promise;
};
Object.defineProperty(Int8Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint8ClampedArray.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int16Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint16Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Int32Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Uint32Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float32Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Float64Array.prototype,'someAwaitSeries', { 'enumerable': false });
Object.defineProperty(Array.prototype,'someAwaitSeries', { 'enumerable': false });

Array.prototype.sortAwait = function(argCallback, callback){
  var collection = this;

  callback = native.util.makeHybridCallbackPromise(callback);

  var sort = async function(data,first,last){
    var i = first;
    var j = last;
    var x = data[ Math.ceil( ( first + last ) / 2 ) ];

    do {
      while ((await argCallback(data[i],x)) < 0) i++;
      while ((await argCallback(data[j],x)) > 0) j--;

      if ( i <= j ) {
        if ( i !== j ) {
          if ((await argCallback(data[i], data[j])) !== 0) {
            var tempItem = data[ i ];
            data[ i ] = data[ j ];
            data[ j ] = tempItem;
          }
        }
        i++;
        j--;
      }

    } while ( i <= j );

    if ( i < last ) {
      await sort(data, i, last);
    }
    if ( first < j ) {
      await sort(data, first, j);
    }
  };

  sort(collection,0,collection.length-1).then(function(){callback.resolve(collection);},callback.reject);

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'sortAwait', { 'enumerable': false });

Array.prototype.reduceAwait = function(argCallback, initialValue, callback){
  var collection = this;

  // normalizing arguments
  if (callback == null && typeof initialValue === 'function'){
    callback = initialValue;
    initialValue = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  var reducePolyfill  = async function(data,asyncCallback){
    if (null === data || 'undefined' === typeof data) {
      throw new TypeError('Array.prototype.reduce called on null or undefined' );
    }
    if ('function' !== typeof asyncCallback) {
      throw new TypeError(asyncCallback + ' is not a function');
    }
    var t = Object(data), len = t.length >>> 0, k = 0, value;
    if (initialValue != null) {
      value = initialValue;
    } else {
      while (k < len && ! k in t) {
        k++;
      }
      if (k >= len) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      value = t[k++];
    }
    for (; k < len; k++) {
      if (k in t) {
        value = await asyncCallback(value, t[k], k, t);
      }
    }
    return value;
  };

  reducePolyfill(collection,argCallback).then(callback.resolve,callback.reject);

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'reduceAwait', { 'enumerable': false });

Array.prototype.reduceRightAwait = function(argCallback, initialValue, callback){
  var collection = this;

  // normalizing arguments
  if (callback == null && typeof initialValue === 'function'){
    callback = initialValue;
    initialValue = null;
  }

  callback = native.util.makeHybridCallbackPromise(callback);

  var reduceRightPolyfill = async function(data,asyncCallback){
    if (null === data || 'undefined' === typeof data) {
      throw new TypeError('Array.prototype.reduce called on null or undefined' );
    }
    if ('function' !== typeof asyncCallback) {
      throw new TypeError(asyncCallback + ' is not a function');
    }
    var t = Object(data), len = t.length >>> 0, k = len - 1, value;
    if (initialValue != null) {
      value = initialValue;
    } else {
      while (k >= 0 && !k in t) {
        k--;
      }
      if (k < 0) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      value = t[k--];
    }
    for (; k >= 0; k--) {
      if (k in t) {
        value = await asyncCallback(value, t[k], k, t);
      }
    }
    return value;
  };

  try {
    reduceRightPolyfill(collection,argCallback).then(callback.resolve,callback.reject);
  } catch(e) {
    callback.reject(e);
  }

  return callback.promise;
};
Object.defineProperty(Array.prototype, 'reduceRightAwait', { 'enumerable': false });

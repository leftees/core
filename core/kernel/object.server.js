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

Object._property_store = Object._property_store || {};
Object._runtime_map = Object._runtime_map || {};

native.object = native.object || {};
native.object.defineProperty = native.object.defineProperty || Object.defineProperty;
native.object.getOwnPropertyDescriptor = native.object.getOwnPropertyDescriptor || Object.getOwnPropertyDescriptor;

Object._isExtensibleDescriptor = function(descriptor){
  if (descriptor.get != null || descriptor.set != null || descriptor.runtime != null) {
    return true;
  }
  return false;
};

Object._defineProperty = function(obj, prop, descriptor){
  var strong_name;
  var legacy_descriptor;
  var extended_descriptor;

  if (typeof obj === 'string' && prop != null && typeof prop === 'object' && descriptor == null){
    descriptor = prop;
    prop = null;
    strong_name = obj;
    var leaf_position = obj.lastIndexOf('.');
    if (leaf_position === -1) {
      prop = obj;
      obj = global;
    } else {
      prop = obj.slice(leaf_position+1);
      obj = platform.kernel.get(obj.slice(0,leaf_position));
    }
  } else if (typeof obj === 'string' && typeof prop === 'string') {
    strong_name = obj + '.' + prop;
    obj = platform.kernel.get(obj);
  }

  if (obj == null || prop == null || descriptor == null){
    throw new Exception('invalid arguments');
  }

  if(strong_name == null){
    return native.object.defineProperty(obj, prop, descriptor);
  }

  if (Object._isExtensibleDescriptor(descriptor) === false && Object._property_store.hasOwnProperty(strong_name) === false){
    return native.object.defineProperty(obj, prop, descriptor);
  }

  extended_descriptor = Object._property_store[strong_name] || {};

  legacy_descriptor = native.object.getOwnPropertyDescriptor(obj, prop) || {
    'configurable': true,
    'enumerable': true,
    'writable': true,
    'value': undefined
  };

  if (legacy_descriptor.configurable === false){
    throw new Exception('property %s is not configurable', strong_name);
  }

  if (descriptor.hasOwnProperty('configurable') === true) {
    legacy_descriptor.configurable = descriptor.configurable;
  }

  if (descriptor.hasOwnProperty('enumerable') === true) {
    legacy_descriptor.enumerable = descriptor.enumerable;
  }

  if (extended_descriptor.hasOwnProperty('writable') === false) {
    if (descriptor.hasOwnProperty('value') === true) {
      extended_descriptor.value = descriptor.value;
    } else if (legacy_descriptor.hasOwnProperty('value') === true) {
      extended_descriptor.value = legacy_descriptor.value;
    } else if (extended_descriptor.hasOwnProperty('value') === true) {
      if (platform.kernel.exists(strong_name) === true) {
        extended_descriptor.value = platform.kernel.get(strong_name);
      } else {
        extended_descriptor.value = undefined;
      }
    }
    if (platform.configuration.debug.object.property.set === true) {
      console.debug('setting initial property %s internal value to %s', strong_name, extended_descriptor.value);
    }
  } else {
    if (descriptor.hasOwnProperty('value') === true) {
      if (extended_descriptor.writable === true) {
        extended_descriptor.value = descriptor.value;
      } else {
        throw new Exception('property %s is not writable', strong_name);
      }
    }
  }

  if (descriptor.hasOwnProperty('writable') === true) {
    extended_descriptor.writable = descriptor.writable;
  }

  if (descriptor.get != null) {
    if (descriptor.get.constructor === Function) {
      if (typeof descriptor.accessor === 'string') {
        descriptor.get.accessor = descriptor.accessor;
      }
      if (extended_descriptor.get == null) {
        extended_descriptor.get = descriptor.get;
      } else if (extended_descriptor.get.constructor === Array) {
          extended_descriptor.get.push(descriptor.get);
      } else if (extended_descriptor.get.constructor === Function) {
          extended_descriptor.get = [extended_descriptor.get, descriptor.get];
      }
    } else {
      throw new Exception('invalid get function for %s', strong_name);
    }
  }

  if (descriptor.set != null) {
    if (descriptor.set.constructor === Function) {
      if (typeof descriptor.accessor === 'string') {
        descriptor.set.accessor = descriptor.accessor;
      }
      if (extended_descriptor.set == null) {
        extended_descriptor.set = descriptor.set;
      } else if (extended_descriptor.set.constructor === Array) {
        extended_descriptor.set.push(descriptor.set);
      } else if (extended_descriptor.set.constructor === Function) {
        extended_descriptor.set = [extended_descriptor.set, descriptor.set];
      }
    } else {
      throw new Exception('invalid set function %s',strong_name);
    }
  }

  if (descriptor.runtime != null && typeof descriptor.runtime === 'string'){
    extended_descriptor.runtime = descriptor.runtime;
    Object._runtime_map[descriptor.runtime] = strong_name;
    if (global.runtime != null) {
      runtime.create(descriptor.runtime);
//? if(CLUSTER) {
      if (platform.configuration.debug.object.property.runtime === true) {
        console.debug('subscribing to runtime variable %s', extended_descriptor.runtime);
      }
      runtime.subscribe(descriptor.runtime);
//? }
    } else {
      //TODO: queue runtime subscription
      console.error('TODO: queue runtime subscription after runtime stack is available');
    }
  }

  if (legacy_descriptor.hasOwnProperty('writable') === true || legacy_descriptor.hasOwnProperty('value') === true) {
    delete legacy_descriptor.writable;
    delete legacy_descriptor.value;
  }

  if (Object._property_store.hasOwnProperty(strong_name) === false) {
    delete obj[prop];
  }
  Object._property_store[strong_name] = extended_descriptor;

  if (platform.configuration.debug.object.property.define === true) {
    console.debug('property %s store updated', strong_name);
  }

  legacy_descriptor.get = Object._defineProperty._get_function.bind(null,strong_name);
  legacy_descriptor.set = Object._defineProperty._set_function.bind(null,strong_name);

  var result = native.object.defineProperty(obj, prop, legacy_descriptor);

  if (platform.configuration.debug.object.property.define === true) {
    console.debug('property %s configured', strong_name);
  }

  return result;
};

/**
 * Implements default operations for building a member get function.
*/
Object._defineProperty._get_function = function(strong_name) {
  var extended_descriptor = Object._property_store[strong_name];
  var stored_value = extended_descriptor.value;
  var result = stored_value;

  if (platform.configuration.debug.object.property.get === true) {
    console.debug('getting property %s internal value %s', strong_name, result);
  }

  if (extended_descriptor.get != null) {
    if (extended_descriptor.get.constructor === Array) {
      extended_descriptor.get.forEach(function(child_get, index){
        result = child_get(result,stored_value);
        if (platform.configuration.debug.object.property.get === true) {
          console.debug('processing get stack for property %s: getter %s returned value %s', strong_name, index, result);
        }
      });
    } else if(typeof extended_descriptor.get === 'function') {
      result = extended_descriptor.get(result,stored_value);
      if (platform.configuration.debug.object.property.get === true) {
        console.debug('processing get stack for property %s: getter returned value %s', strong_name, result);
      }
    }
  }

  if (platform.configuration.debug.object.property.get === true) {
    console.debug('returning property %s value %s', strong_name, result);
  }
  return result;
};

/**
 * Implements default operations for building a member set function.
 * @param {} value Specifies the value to be used in the template function construction.
*/
Object._defineProperty._set_function = function(strong_name,new_value,runtime_update) {
  var extended_descriptor = Object._property_store[strong_name];
  var stored_value = extended_descriptor.value;
  var result = new_value;

  //TODO: support extended serialization
  if (extended_descriptor.runtime != null && typeof new_value === 'function') {
    throw new Exception('setting runtime variable %s to functions is not currently supported',extended_descriptor.runtime);
  }

  if (extended_descriptor.writable === false /*|| extended_descriptor.set == null*/){
    throw new Exception('property %s is not writable', strong_name);
  }

  if (platform.configuration.debug.object.property.set === true) {
    console.debug('changing property %s new value to %s', strong_name, result);
  }

  if (extended_descriptor.set != null) {
    if (extended_descriptor.set.constructor === Array) {
      extended_descriptor.set.forEach(function(child_set){
        result = child_set(new_value,result,stored_value,runtime_update);
        if (platform.configuration.debug.object.property.set === true) {
          console.debug('processing set stack for property %s: setter %s changed value to %s', strong_name, index, result);
        }
      });
    } else if(typeof extended_descriptor.set === 'function') {
      result = extended_descriptor.set(new_value,result,stored_value,runtime_update);
      if (platform.configuration.debug.object.property.set === true) {
        console.debug('processing set stack for property %s: setter changed value to %s', strong_name, result);
      }
    }
  }

  if (platform.configuration.debug.object.property.set === true) {
    console.debug('setting property %s internal value to %s', strong_name, result);
  }

  if (runtime_update !== true && result !== stored_value && extended_descriptor.runtime != null) {
    if (platform.configuration.debug.object.property.runtime === true) {
      console.debug('setting runtime variable %s internal value to %s', extended_descriptor.runtime, result);
    }
    runtime.set(extended_descriptor.runtime,new_value);
  }

  extended_descriptor.value = result;

  return result;
};

Object._getOwnPropertyDescriptor = function(obj,prop){
  var strong_name;
  if (typeof obj === 'string' && prop != null && typeof prop === 'string'){
    strong_name = obj + '.' + prop;
    obj = obj = platform.kernel.get(obj);
  }
  if (prop == null && typeof obj === 'string') {
    strong_name = obj;
    var leaf_position = obj.lastIndexOf('.');
    if (leaf_position === -1) {
      prop = obj;
      obj = global;
    } else {
      prop = obj.slice(leaf_position+1);
      obj = platform.kernel.get(obj.slice(0,leaf_position));
    }
  }

  if (strong_name == null && Object._property_store.hasOwnProperty(strong_name) === false) {
    return native.object.getOwnPropertyDescriptor(obj,prop);
  } else {
    var extended_descriptor = Object._property_store[strong_name];
    var legacy_descriptor = native.object.getOwnPropertyDescriptor(obj,prop);
    extended_descriptor.configurable = legacy_descriptor.configurable;
    extended_descriptor.enumerable = legacy_descriptor.enumerable;
    return extended_descriptor;
  }
};

Object.defineProperty = Object._defineProperty;
Object.getOwnPropertyDescriptor = Object._getOwnPropertyDescriptor;

//TODO: implement delete support as preprocessor to clean values
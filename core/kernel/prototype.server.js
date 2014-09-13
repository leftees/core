'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

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

Object.definePropertyEx = function(obj_name, prop, descriptor, target){
  var target_name;
  var full_name;
  var property_name;
  var extended_descriptor;

  var legacy_descriptor;
  var property_store;

  if (descriptor == null && prop != null && typeof prop === 'object' && typeof obj_name === 'string') {
    extended_descriptor = prop;
    var leaf_position = obj_name.lastIndexOf('.');
    if (leaf_position === -1) {
      property_name = obj_name;
      target_name = 'global';
      target = target || global;
    } else {
      property_name = obj_name.slice(leaf_position+1);
      target_name = obj_name.slice(0,leaf_position-1);
      target = target || platform.kernel.get(target_name);
    }
    full_name = obj_name;
  } else {
    extended_descriptor = descriptor;
    property_name = prop;
    target_name = obj_name;
    target = target || platform.kernel.get(obj_name);
    full_name = target_name + '.' + property_name;
  }

  if (target == null || typeof target !== 'object' || target_name == null || typeof target_name !== 'string' || property_name == null || typeof property_name !== 'string' || extended_descriptor == null || typeof extended_descriptor !== 'object'){
    throw new Exception('invalid arguments');
  }

  legacy_descriptor = {};
  property_store = Object._property_store[full_name] || {};
  property_store.name = property_store.name || full_name;

  if (property_store.configurable === false){
    throw new Exception('property %s is not configurable', full_name);
  }

  if (extended_descriptor.hasOwnProperty('configurable') === true) {
    legacy_descriptor.configurable = extended_descriptor.configurable;
  }

  if (extended_descriptor.hasOwnProperty('enumerable') === true) {
    legacy_descriptor.enumerable = extended_descriptor.enumerable;
  }

  if (property_store.writable !== false) {
    if (extended_descriptor.hasOwnProperty('value') === true) {
      property_store.value = extended_descriptor.value;
      /*} else if (extended_descriptor.hasOwnProperty('remote') === true && something === true) {
       //T: get from session or register wrap?
       */
    } else {
      try {
        property_store.value = platform.kernel.get(full_name);
      } catch (err) {
        property_store.value = undefined;
      }
    }
    if (platform.configuration.server.debugging.object.property.set === true) {
      console.debug('setting property %s internal value to %s', full_name, property_store.value);
    }
  } else {
    throw new Exception('property %s is not writable', full_name);
  }

  if (extended_descriptor.hasOwnProperty('writable') === true) {
    property_store.writable = extended_descriptor.writable;
  }

  if (extended_descriptor.hasOwnProperty('get') === true && extended_descriptor.get != null) {
    if (extended_descriptor.get.constructor === Array) {
      if (extended_descriptor.get.length > 0) {
        if (property_store.get == null) {
          property_store.get = [];
        } else if (typeof property_store.get === 'function') {
          property_store.get = [property_store.get];
        }
        extended_descriptor.get.forEach(function (child_function, index) {
          if (child_function != null && typeof child_function.constructor === 'function') {
            property_store.get.push(child_function);
          } else {
            throw new Exception('invalid get function at index %s', index);
          }
        });
      }
    } else if (typeof extended_descriptor.get === 'function') {
      if (property_store.get == null) {
        property_store.get = extended_descriptor.get;
      } else if (property_store.get.constructor === Array) {
          property_store.get.push(extended_descriptor.get);
      } else if (typeof property_store.get === 'function') {
          property_store.get = [property_store.get, extended_descriptor.get];
      }
    } else {
      throw new Exception('invalid get function');
    }
  }

  if (extended_descriptor.hasOwnProperty('set') === true && extended_descriptor.set != null) {
    if (extended_descriptor.set.constructor === Array) {
      if (extended_descriptor.set.length > 0) {
        if (property_store.set == null) {
          property_store.set = [];
        } else if (typeof property_store.set === 'function') {
          property_store.set = [property_store.set];
        }
        extended_descriptor.set.forEach(function (child_function, index) {
          if (child_function != null && typeof child_function.constructor === 'function') {
            property_store.set.push(child_function);
          } else {
            throw new Exception('invalid set function at index %s', index);
          }
        });
      }
    } else if (typeof extended_descriptor.set === 'function') {
      if (property_store.set == null) {
        property_store.set = extended_descriptor.set;
      } else if (property_store.set.constructor === Array) {
        property_store.set.push(extended_descriptor.set);
      } else if (typeof property_store.set === 'function') {
        property_store.set = [property_store.set, extended_descriptor.set];
      }
    } else {
      throw new Exception('invalid set function');
    }
  }

  if (extended_descriptor.hasOwnProperty('prelink') === true) {
    if (typeof extended_descriptor.prelink === 'string') {
      property_store.prelink = extended_descriptor.prelink;
      if (global.hasOwnProperty(property_store.prelink) === true) {
        delete global[property_store.prelink];
        if (platform.configuration.server.debugging.object.property.set === true) {
          console.warn('property %s resetting prelink %s', full_name, property_store.prelink);
        }
      }
      Object.defineProperty(global,property_store.prelink,{
        get: Object.definePropertyEx._get_function.bind(null,full_name),
        set: Object.definePropertyEx._set_function.bind(null,full_name)
      });
      if (platform.configuration.server.debugging.object.property.set === true) {
        console.warn('property %s prelinked with %s', full_name, property_store.prelink);
      }
    } else {
      throw new Exception('invalid prelink identifier');
    }
  }

  if (extended_descriptor.hasOwnProperty('persist') === true) {
    switch(extended_descriptor.persist){
      case true:
      case 'normal':
        property_store.persist = 1;
        break;
      case 'critical':
        property_store.persist = 2;
        break;
      default:
        property_store.persist = false;
        break;
    }
    //T: read value if stored
    if (platform.configuration.server.debugging.object.property.persist === true){
      console.debug('property %s value imported from persist store',full_name);
    }
    if (property_store.persist === 2 && extended_descriptor.hasOwnProperty('value') === true) {
      //T: store value to persistent store
      if (platform.configuration.server.debugging.object.property.persist === true) {
        console.debug('property %s value exported to persist store', full_name);
      }
    }
  }

  //T: support remote

  Object._property_store[full_name] = property_store;

  if (platform.configuration.server.debugging.object.property.define === true) {
    console.debug('property %s store updated', full_name);
  }

  legacy_descriptor.get = Object.definePropertyEx._get_function.bind(null,full_name);
  legacy_descriptor.set = Object.definePropertyEx._set_function.bind(null,full_name);

  Object.defineProperty(target,property_name,legacy_descriptor);

  if (platform.configuration.server.debugging.object.property.define === true) {
    console.debug('property %s configured', full_name);
  }

};

//F: Implements default operations for building a member get function.
/*#preprocessor.disable*/
Object.definePropertyEx._get_function = function(full_name) {
  var property_store = Object._property_store[full_name];
  var stored_value = property_store.value;
  var result = stored_value;

  if (platform.configuration.server.debugging.object.property.get === true) {
    console.debug('getting property %s internal value %s', full_name, result);
  }

  if (property_store.get != null) {
    if (property_store.get.constructor === Array) {
      property_store.get.forEach(function(child_get){
        result = child_get(result,stored_value);
        if (platform.configuration.server.debugging.object.property.get === true) {
          console.debug('changing property %s return value to %s', full_name, result);
        }
      });
    } else if(typeof property_store.get === 'function') {
      result = property_store.get(result,stored_value);
      if (platform.configuration.server.debugging.object.property.get === true) {
        console.debug('changing property %s return value to %s', full_name, result);
      }
    }
  }

  if (platform.configuration.server.debugging.object.property.get === true) {
    console.debug('returning property %s value %s', full_name, result);
  }
  return result;
};

//F: Implements default operations for building a member set function.
//A: value: Specifies the value to be used in the template function construction.
/*#preprocessor.disable*/
Object.definePropertyEx._set_function = function(full_name,new_value) {
  var property_store = Object._property_store[full_name];
  var stored_value = property_store.value;
  var result = new_value;

  if (property_store.writable === false){
    throw new Exception('property %s is not writable', full_name);
  }

  if (platform.configuration.server.debugging.object.property.set === true) {
    console.debug('changing property %s new value to %s', full_name, result);
  }

  //T: remote_readonly

  if (property_store.set != null) {
    if (PropertyStore.set.constructor === Array) {
      property_store.set.forEach(function(child_set){
        result = child_set(result,new_value,stored_value);
        if (platform.configuration.server.debugging.object.property.set === true) {
          console.debug('changing property %s new value to %s', full_name, result);
        }
      });
    } else if(typeof property_store.set === 'function') {
      result = property_store.set(result,new_value,stored_value);
      if (platform.configuration.server.debugging.object.property.set === true) {
        console.debug('changing property %s new value to %s', full_name, result);
      }
    }
  }

  if (platform.configuration.server.debugging.object.property.set === true) {
    console.debug('setting property %s internal value to %s', full_name, result);
  }
  property_store.value = result;

  //T: remote set

  if (property_store.persist === 2){
    //T: store value to persistent store
    if (platform.configuration.server.debugging.object.property.persist === true) {
      console.debug('property %s value exported to persist store', full_name);
    }
  }

  return result;
};

Object.definePropertiesEx = function(obj_name,props) {
  var target = platform.kernel.get(obj_name);
  if (target == null || typeof target !== 'object') {
    throw new Exception('%s is not a valid object',obj_name);
  }
  Object.keys(props).forEach(function(prop){
    Object.definePropertyEx(obj_name, prop, props[prop], target);
  });
};

Object.getOwnPropertyDescriptorEx = function(obj_name,prop){
  var full_name;
  if (prop == null && typeof obj_name === 'string') {
    full_name = obj_name;
  } else {
    full_name = obj_name + '.' + prop;
  }

  return Object._property_store[full_name];
};
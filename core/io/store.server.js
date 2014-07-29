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

//N: Provides IO helper with abstract filesystem and packaged module support.
platform.io = platform.io || {};

platform.io.store = platform.io.store || {};

platform.io.store.__priorities__ = [];
platform.io.store.__backends__ = {};

platform.io.store.register = function(name,backend,priority){
  if (platform.classes.exist(name) === false) {
    var newpriority = priority;
    if (typeof newpriority !== 'number'){
      newpriority = -1;
    } else if (newpriority < 0) {
      newpriority = -1;
    } else if ((newpriority === 0 && name !== 'app') || (newpriority !== 0 && name === 'app')) {
      throw new Exception('store \'app\' with priority \'0\' cannot be modified');
    }
    platform.io.store.__backends__[name] = backend;
    platform.io.store.__backends__[name].name = name;
    if (newpriority > -1) {
      platform.io.store.__priorities__.splice(newpriority, 0, name);
    }
    return true;
  } else {
    throw new Exception('class \'%s\' already exists',name);
  }
};

platform.io.store.unregister = function(name){
  if (platform.io.store.exist(name) === true && name !== 'app') {
    var oldindex = platform.io.store.__priorities__.indexOf(name);
    if (oldindex > -1) {
      platform.io.store.__priorities__.splice(oldindex, 1);
    }
    return delete platform.io.store.__backends__[name];
  } else {
    throw new Exception('store \'%s\' oes not exist',name);
  }
};

platform.io.store.list = function(){
  var result = [];
  platform.io.store.__priorities__.forEach(function(name){
    result.push(platform.io.store.__backends__[name]);
  });
  return result;
};

platform.io.store.exist = function(name){
  return (platform.io.store.__backends__.hasOwnProperty(name));
};

platform.io.store.getByName = function(name){
  if (platform.io.store.exist(name) === true) {
    return platform.io.store.__backends__[name];
  } else {
    throw new Exception('store \'%s\' not found',name);
  }
};

platform.io.store.getByPriority = function(priority){
  var newpriority = priority;
  if (typeof newpriority !== 'number'){
    return null;
  } else if (newpriority < 0 && newpriority >= platform.io.store.__priorities__.length) {
    return null;
  }
  return platform.io.store.__backends__[platform.io.store.__priorities__[newpriority]];
};

platform.io.store.getPriority = function(name){
  if (platform.io.store.exist(name) === true) {
    return platform.io.store.__priorities__.indexOf(name);
  } else {
    throw new Exception('store \'%s\' not found',name);
  }
};

platform.io.store.setPriority = function(name,priority){
  if (platform.io.store.exist(name) === true) {
    var newpriority = priority;
    if (typeof newpriority !== 'number'){
      newpriority = -1;
    } else if (newpriority < 0) {
      newpriority = -1;
    } else if (newpriority === 0 || name === 'app') {
      throw new Exception('store \'app\' with priority \'0\' cannot be modified');
    }
    var oldindex = platform.io.store.__priorities__.indexOf(name);
    if (oldindex > 0) {
      platform.io.store.__priorities__.splice(oldindex, 1);
    }
    if (newpriority > 0) {
      platform.io.store.__priorities__.splice(newpriority, 0, name);
    }
  } else {
    throw new Exception('store \'%s\' not found',name);
  }
};

platform.io.store.register('app',platform.kernel.new('core.io.store.file',[ platform.runtime.path.app ]),0);
platform.io.store.register('core',platform.kernel.new('core.io.store.file',[ platform.runtime.path.core ]),1);

//T: support multiple backends by configuration

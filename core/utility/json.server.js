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
 * Provides utility and functions to support development and execution.
 * @namespace
*/
platform.utility = platform.utility || {};

/**
 * Creates a new object using a string as JSON representation with type-guessing. [Functions are not processed by default for security reasons.]
 * @param {} json_string Specifies the string object to use for JSON object creation.
 * @param {} [safe] Specifies whether functions should be parsed. Default is true.
 * @param {} [outer] Specifies whether the string can be contained in apexes. Default is false.
 * @return {} Returns object created by JSON string.
*/
JSON._parseNormalize = function(json_string,safe,outer) {
  //json_string = json_string.replace(/\n|\t/gi, '');
  if (outer === true && (/^[\"\']{1}.*[\"\']{1}$/g).test(json_string) === true) {
    json_string = json_string.slice(1, json_string.length - 1);
  }
  if (json_string === '\"undefined\"' || json_string === '\'undefined\'' || json_string === 'undefined') {
    return undefined;
  } else if (json_string === '\"null\"' || json_string === '\'null\'' || json_string == 'null') {
    return null;
  } else if (json_string === '\"true\"' || json_string === '\'true\'' || json_string == 'true') {
    return true;
  } else if (json_string === '\"false\"' || json_string === '\'false\'' || json_string == 'false') {
    return false;
  } else if ((/^[\"\']{0,1}function[^\051]*?\050{1}[^\0]*?\051{1}\040*?\173{1}.*\175{1}$/g).test(json_string) === true) {
    if (safe === false) {
      var function_arguments = json_string.match(/^function[^\051]*?\050{1}[^\0]*?\051{1}\040*/)[0].replace(/^function[^\051]*?\050{1}/, '').replace(/\040*$/, '').slice(0, -1);
      var function_body = json_string.replace(/^function[^\051]*?\050{1}[^\0]*?\051{1}\040*?\173{1}\040*/, '').slice(0, -1);
      return new Function(function_arguments, function_body);
    }
  } else if ((/^[+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?$/g).test(json_string) === true) {
    return parseFloat(json_string);
  } else if ((/^[\"\']{0,1}\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z[\"\']{0,1}$/g).test(json_string) === true) {
    return new Date(json_string.replace(/\"|\'/gi, ''));
  } else if ((/^[\"\']{0,1}\/.*\/[gmix]*[\"\']{0,1}$/).test(json_string) === true) {
    var regexp_body = json_string.slice(2).slice(0, -2);
    var regexp_modifiers = (regexp_body.match(/[gmi]*$/) != null) ? regexp_body.match(/[gmi]*$/)[0] : '';
    var regexp_patterns = regexp_body.replace(/[gmi]*$/, '');
    return new RegExp(regexp_patterns, regexp_modifiers);
  }
  return json_string;
};

//TODO: MISSING CODE DOCUMENTATION
JSON.normalize = function(target,safe){
  if (target == null){
    return target;
  }
  platform.utility.recursiveCallH(function(json_object){
    var pending = [];
    Object.keys(json_object).forEach(function(key){
      var leaf_target = json_object[key];
      if (leaf_target != null){
        if (leaf_target.constructor === String) {
          json_object[key] = JSON._parseNormalize(leaf_target,safe);
        } else if(leaf_target.constructor === Object || leaf_target.constructor === Array){
          // pushing object into pending array, if it is a generic object or an array
          pending.push(leaf_target);
        }
      }
    });
    return pending;
  }, null, target);
  return target;
};

//TODO: MISSING CODE DOCUMENTATION.
JSON.parseAndNormalize = function(json_string,safe,evaluate) {
  //evaluate = true;
  var json_normalized = JSON._parseNormalize(json_string,safe,true);
  if ((/^\s*\{.*\}\s*$|^\s*\[.*\]\s*$/g).test(json_normalized) === false){
    return json_normalized;
  } else {
    var result;
    if (evaluate === true) {
      result = eval("(" + json_normalized + ")");
      return result;
    } else {
      result = JSON.parse(json_normalized);
      //TODO: try-catch to use custom json parser?
    }
    result = JSON.normalize(result, safe);
    return result;
  }
};

JSON._isPrivateKeyRegExp = /^_[a-z$_][\w$]*$/i;
JSON.isPrivateKeyName = function(key){
  return (JSON._isPrivateKeyRegExp.test(key) === true && (JSON._isPrivateKeyRegExp.lastIndex = 0) === 0);
};

// returns null if property is excluded
JSON._getSkeleton = function(target,parent_object,key,includeComputed){
  var skeleton_data = {};
  if (parent_object != null) {
    var descriptor = Object.getOwnPropertyDescriptor(parent_object, key);
    if (descriptor.writable === false) {
      skeleton_data.readonly = true;
    }
    if (descriptor.set != null && descriptor.get != null) {
      if (includeComputed !== true) {
        return null;
      } else {
        skeleton_data.computed = true;
      }
    }
  }
  skeleton_data.type = typeof target;
  switch (skeleton_data.type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
      break;
    case 'object':
    case 'function':
      if (target == null) {
        skeleton_data.type = 'null';
      } else {
        switch (target.constructor) {
          case Object:
          case Array:
          case RegExp:
            break;
          case Function:
            skeleton_data.args = Function.info.arguments(target);
            //data.async = child_object.isGenerator();
            //data.generator = child_object.isAsync();
            break;
          default:
            //TODO: support serializable constructors?
            skeleton_data.type = 'class';
            break;
        }
      }
      break;
  }
  return skeleton_data;
};

//TODO: MISSING CODE DOCUMENTATION
// defaults: recursive:false,includePrivate:false,includeComputed:false
JSON.skeleton = function(target,recursive,onlyFunction,includePrivate,includeComputed,skipPaths){
  var result = {
    '__skeleton_data_': JSON._getSkeleton(target)
  };
  //if (target === global) {
  //  return result;
  //}
  var cache = [];
  var paths = [];
  platform.utility.recursiveCallV(function(working_object){
    var parent_object = working_object.object;
    var skeleton_object = working_object.skeleton;
    var path_object = working_object.path;
    var pending = [];
    Object.keys(parent_object).forEach(function(key) {
      if (key === '__skeleton_data_') {
        return;
      }
      if (includePrivate !== true && JSON.isPrivateKeyName(key) === true) {
        return;
      }
      var next_path = ((path_object==null)?'':(path_object+'.')) + key;
      if (skipPaths != null && skipPaths.indexOf(next_path) !== -1){
        return;
      }
      var leaf_target = parent_object[key];
      //if (leaf_target === native || leaf_target === global) {
      //  return;
      //}
      var skeleton_data = JSON._getSkeleton(leaf_target, parent_object, key, includeComputed);
      if (skeleton_data != null) {
        skeleton_object[key] = { '__skeleton_data_': skeleton_data };
        switch(skeleton_data.type) {
          case 'object':
          //case 'function':
            if (recursive === true) {
              var cacheIndex = cache.indexOf(leaf_target);
              if (cacheIndex !== -1) {
                skeleton_data.type = 'reference';
                skeleton_data.path = paths[cacheIndex];
              } else {
                if (skeleton_data.type !== 'function') {
                  cache.push(leaf_target);
                  paths.push(next_path);
                }
                if (Object.keys(leaf_target).length !== 0) {
                  // pushing object into pending array, if it is a generic object or an array
                  pending.push({
                    'object': leaf_target,
                    'skeleton': skeleton_object[key],
                    'path': next_path
                  });
                }
              }
            } else if (Object.keys(leaf_target).length !== 0) {
              skeleton_data.collapsed = true;
            }
            break;
          case 'class':
            //TODO: support serializable class design
            break;
        }
      }
    });
    return pending;
  }, null, {
    'object': target,
    'skeleton': result,
    'path': null
  });
  cache = null;
  paths = null;
  return result;
};

//TODO: MISSING CODE DOCUMENTATION
JSON.unskeleton = function(skeleton,callback){
  var skip = {};
  var result = callback(skeleton.__skeleton_data_);
  platform.utility.recursiveCallV(function(working_object){
    var target_object = working_object.target;
    var skeleton_object = working_object.skeleton;
    var path_object = working_object.path;
    var pending = [];
    Object.keys(skeleton_object).forEach(function(key){
      if (key === '__skeleton_data_') {
        return;
      }
      var next_path = ((path_object==null)?'':(path_object+'.')) + key;
      var skeleton_data = skeleton_object[key].__skeleton_data_;
      var leaf_resolved = callback(skeleton_data,key,target_object,next_path,result,skip);
      if (leaf_resolved != null && leaf_resolved !== skip) {
        target_object[key] = leaf_resolved;
        if (skeleton_data.type === 'object') {
          if (target_object[key] == null) {
            target_object[key] = {};
          }
          pending.push({
            'target': target_object[key],
            'skeleton': skeleton_object[key],
            'path': next_path
          });
        }
      }
    });
    return pending;
  }, null, {
    'target': result,
    'skeleton': skeleton,
    'path': null
  });
  return result;
};
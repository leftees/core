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

//N: Provides utility and functions to support development and execution.
platform.utility = platform.utility || {};

//F: Processes a function recursively for each element in specified object tree preventing maximum call stack exceed.
//A: leaf_callback: Specifies which function to call for each element in the object tree.
//A: [end_callback]: Specifies which function to call after the whole tree has been processed.
//A: rootObject: Specifies the element containing the whole object tree.
//A: [...]: Unhardcoded pass-through arguments to push when calling CallFunction.
platform.utility.recursiveCallH = function (leaf_callback,end_callback,root) {
  var pending = [];
  //C: getting array object from arguments custom object extending Array.prototype
  var invoke_arguments = Array.prototype.slice.call(arguments);
  //C: adding root object to pending queue
  pending.push(invoke_arguments[2]);
  //C: removing RecursiveCall specific arguments (RootObject, CallFunction, CompleteFunction)
  invoke_arguments.shift();
  invoke_arguments.shift();
  invoke_arguments.shift();
  //C: processing pending queue until is empty
  do {
    //C: calling specified function with current pending object, as first argument, and pass-through arguments (sanitizing returned values to empty array if null)
    var pendingArray = leaf_callback.apply(this,[pending[0]].concat(invoke_arguments)) || [];
    //C: cleaning current processed object
    pending.shift();
    //C: extending pending queue to vertically traverse
    if (pendingArray.constructor === Array) {
      pending = pendingArray.concat(pending);
    }
  } while (pending.length);
  //C: executing CompleteFunction if not null
  if (end_callback != null) {
    end_callback.apply(this,invoke_arguments);
  }
};

//F: Processes a function recursively for each element in specified object tree preventing maximum call stack exceed.
//A: leaf_callback: Specifies which function to call for each element in the object tree.
//A: [end_callback]: Specifies which function to call after the whole tree has been processed.
//A: rootObject: Specifies the element containing the whole object tree.
//A: [...]: Unhardcoded pass-through arguments to push when calling CallFunction.
platform.utility.recursiveCallV = function (leaf_callback,end_callback,root) {
  var pending = [];
  //C: getting array object from arguments custom object extending Array.prototype
  var invoke_arguments = Array.prototype.slice.call(arguments);
  //C: adding root object to pending queue
  pending.push(invoke_arguments[2]);
  //C: removing RecursiveCall specific arguments (RootObject, CallFunction, CompleteFunction)
  invoke_arguments.shift();
  invoke_arguments.shift();
  invoke_arguments.shift();
  //C: processing pending queue until is empty
  do {
    //C: calling specified function with current pending object, as first argument, and pass-through arguments (sanitizing returned values to empty array if null)
    var pendingArray = leaf_callback.apply(this,[pending[0]].concat(invoke_arguments)) || [];
    //C: cleaning current processed object
    pending.shift();
    //C: extending pending queue to vertically traverse
    if (pendingArray.constructor === Array) {
      pending = pending.concat(pendingArray);
    }
  } while (pending.length);
  //C: executing CompleteFunction if not null
  if (end_callback != null) {
    end_callback.apply(this,invoke_arguments);
  }
};

//F: Gets the arguments of a function.
//A: target: Specifies the function object within retrieve arguments.
//R: Returns the arguments name of a function, as array of string.
Function.info = {};
Function.info.arguments = function(target) {
  var result = target.toString().match(/[^\0]*?(?=\))/g)[0].replace(/[^\0]*?\(|\s/g,'').split(',');
  if (result.length != 0) {
    //**WORKAROUND Chrome 20.0.15**//
    if (result[result.length-1] == '/**/') {
      result.pop();
    }
  }
  if (result.length == 1 && result[0] == "")
    return [];
  else
    return result;
};

//F: Get the inner code of this function.
//A: target: Specifies the function object from which to retrieve the code.
//A: [compact]: Specifies whether to return compacted (single line).
//R: Returns the inner code of a function, as string.
Function.info.code = function(target, compact) {
  var code = target.toString();
  code = code.slice(code.indexOf('{')+1,code.lastIndexOf('}')-1);
  if (compact === true){
    code = code.replace(/[\n\r]/gi,'');
  }
  return code;
};

//F: Creates a new object using a string as JSON representation with type-guessing. [Functions are not processed by default for security reasons.]
//A: json_string: Specifies the string object to use for JSON object creation.
//A: [safe]: Specifies whether functions should be parsed. Default is true.
//A: [outer]: Specifies whether the string can be contained in apexes. Default is false.
//R: Returns object created by JSON string.
JSON._parseNormalize = function(json_string,safe,outer) {
  json_string = json_string.replace(/\n|\t/gi, '');
  if (outer === true && (/^[\"\']{1}.*[\"\']{1}$/g).test(json_string) === true){
    json_string = json_string.slice(1,json_string.length-1);
  }
  if ((/^[\"\']{0,1}function[^\051]*?\050{1}[^\0]*?\051{1}\040*?\173{1}.*\175{1}$/g).test(json_string) === true) {
    if (safe === false) {
      var function_arguments = json_string.match(/^function[^\051]*?\050{1}[^\0]*?\051{1}\040*/)[0].replace(/^function[^\051]*?\050{1}/, '').replace(/\040*$/, '').slice(0, -1);
      var function_body = json_string.replace(/^function[^\051]*?\050{1}[^\0]*?\051{1}\040*?\173{1}\040*/, '').slice(0, -1);
      return new Function(function_arguments, function_body);
    }
  } else if ((/^[\"\']{0,1}\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z[\"\']{0,1}$/g).test(json_string) === true) {
    return new Date(json_string.replace(/\"|\'/gi, ''));
  } else if (json_string === '\"undefined\"' || json_string === '\'undefined\'' || json_string === 'undefined') {
    return undefined;
  } else if (json_string === '\"null\"' || json_string === '\'null\'' || json_string == 'null') {
    return null;
  } else if (json_string === '\"true\"' || json_string === '\'true\'' || json_string == 'true') {
    return true;
  } else if (json_string === '\"false\"' || json_string === '\'false\'' || json_string == 'false') {
    return false;
  } else if ((/^[\"\']{0,1}\/.*\/[gmix]*[\"\']{0,1}$/).test(json_string) === true) {
    var regexp_body = json_string.slice(2).slice(0, -2);
    var regexp_modifiers = (regexp_body.match(/[gmi]*$/) != null) ? regexp_body.match(/[gmi]*$/)[0] : '';
    var regexp_patterns = regexp_body.replace(/[gmi]*$/, '');
    return new RegExp(regexp_patterns, regexp_modifiers);
  }
  return json_string;
};

//T: MISSING CODE DOCUMENTATION
JSON.normalize = function(target,safe){
  platform.utility.recursiveCallH(function(json_object){
    var pending = [];
    Object.keys(json_object).forEach(function(key){
      var leaf_target = json_object[key];
      if (leaf_target != null){
        if (leaf_target.constructor === String) {
          json_object[key] = JSON._parseNormalize(leaf_target,safe);
        } else if(leaf_target.constructor === Object || leaf_target.constructor === Array){
          //C: pushing object into pending array, if it is a generic object or an array
          pending.push(leaf_target);
        }
      }
    });
    return pending;
  }, null, target);
  return target;
};

//T: MISSING CODE DOCUMENTATION.
JSON.parseAndNormalize = function(json_string,safe,evaluate) {
  //evaluate = true;
  var json_normalized = JSON._parseNormalize(json_string,safe,true);
  if (typeof json_normalized !== 'string'){
    return json_normalized;
  }
  if ((/^\s*\{.*\}\s*$/g).test(json_normalized) === false){
    return json_normalized;
  } else {
    var result;
    if (evaluate === true) {
      result = eval("(" + json_normalized + ")");
      return result;
    } else {
      result = JSON.parse(json_normalized);
      //T: try-catch to use custom json parser?
    }
    result = JSON.normalize(result, safe);
    return result;
  }
};

//F: Returns a human readable timespan.
Number.toHumanTime = function (elapsed) {
  var labels = ['ms', 's', 'm', 'h', 'd'];
  var sizes = [1000, 60, 60, 24 ];
  var data = [];
  sizes.forEach(/*#preprocessor.disable:*/function(value){
    data.push(elapsed % value);
    elapsed = parseInt(elapsed/value);
  });
  var pos = 0;
  data.forEach(/*#preprocessor.disable:*/function(value,index){
    if(value > 0){
      pos = index;
    }
  });
  var result = data[pos];
  if (pos > 0) {
    result += '.' + parseInt(data[pos-1]/sizes[pos-1]*10);
  }
  result += labels[pos];
  return result;
};

//F: Returns human readable byte size.
Number.toHumanSize = function (bytes) {
  var labels = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + labels[i];
};

//C: extending String object (not prototype) with hashing implementations
String.hash = {};

//F: Returns hash with Jenkins algorithm.
//A: data: Specifies the string to be hashed.
String.hash.jenkins = function(data) {
  var data_buffer = new Uint32Array(new Buffer(data));

  var uint_slots = new Uint32Array(3);

  var len = data_buffer.length;
  uint_slots[0] = uint_slots[1] = 0x9e3779b9;
  uint_slots[2] = 0;
  var i = 0;
  while (i + 12 <= len)
  {
    uint_slots[0] += data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i++] << 24);
    uint_slots[1] += data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i++] << 24);
    uint_slots[2] += data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i++] << 24);
    uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>13);
    uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<8);
    uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>13);
    uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>12);
    uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<16);
    uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>5);
    uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>3);
    uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<10);
    uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>15);
  }
  uint_slots[2] += len;
  if (i < len)
    uint_slots[0] += data[i++];
  if (i < len)
    uint_slots[0] += data[i++] << 8;
  if (i < len)
    uint_slots[0] += data[i++] << 16;
  if (i < len)
    uint_slots[0] += data[i++] << 24;
  if (i < len)
    uint_slots[1] += data[i++];
  if (i < len)
    uint_slots[1] += data[i++] << 8;
  if (i < len)
    uint_slots[1] += data[i++] << 16;
  if (i < len)
    uint_slots[1] += data[i++] << 24;
  if (i < len)
    uint_slots[2] += data[i++] << 8;
  if (i < len)
    uint_slots[2] += data[i++] << 16;
  if (i < len)
    uint_slots[2] += data[i++] << 24;
  uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>13);
  uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<8);
  uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>13);
  uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>12);
  uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<16);
  uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>5);
  uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>3);
  uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<10);
  uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>15);
  return uint_slots[2];
};

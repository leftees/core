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

platform.kernel._preprocessors.server.code_profile = function(ast,code,file,module,preprocessor){
  //C: keeps last function/program object
  var scopes = [];
  //C: keeps current function index (level)
  var level = 0;

  scopes[level] = ast;

  var prepend_code = Function.info.code(_code_profile_start_monitor);
  var append_code = Function.info.code(_code_profile_stop_monitor);

  var node = ast;
  while (node != null) {
    var skip = false;
    if (scopes[level] != null && scopes[level].tags != null && scopes[level].tags['preprocessor.disable'] != null && scopes[level].tags['preprocessor.disable'].indexOf(preprocessor) > -1){
      skip = true;
    }
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      ++level;
      scopes[level] = node;
    }
    if (scopes[level] != null && node === scopes[level].tree.end) {
      --level;
    }
    if (skip === false) {
      if (node.tags != null && node.tags['profile'] != null) {
        if (node.is_block === true){
          //T: support multiple keys?
          //T: append code to the closest safe node (backward)
          node.prepend.push(prepend_code);
          node.append.unshift(append_code.replace('$0',node.tags['profile'][0]));
        } else {
          console.warn('profile tag ignored for node at line %s in %s',node.loc.start.line,(file == null) ? 'eval code' : ('file ' + file));
        }
      }
    }
    node = node.tree.next;
  }
};

platform.kernel._preprocessors.server.code_profile._data = [];

platform.metrics = platform.metrics || {};

platform.metrics.code = platform.metrics.code || {};

//F: Start performance monitor for code metrics. [The code of this function is propagated by this preprocessor.]
//A: $0: Specifies the key to be pushed with profiled metrics.
var _code_profile_start_monitor = function() {
  if (platform.configuration.server.kernel.profiling === true) {
    (function () {
      var time_start = Date.now();
      platform.kernel._preprocessors.server.code_profile._data.push(time_start);
    })();
  }
};

//F: Stop performance monitor and log data for code metrics. [The code of this function is propagated by this preprocessor.]
var _code_profile_stop_monitor = function() {
  if (platform.configuration.server.kernel.profiling === true) {
    (function(){
      var key = '$0';
      var time_stop = Date.now();
      var time_start = platform.kernel._preprocessors.server.code_profile._data.pop();
      var time_elapsed =  time_stop - time_start;
      //C: updating metrics statistics
      if (platform.metrics.code.hasOwnProperty(key) === false) {
        platform.metrics.code[key] = {
          'min': time_elapsed,
          'max': time_elapsed,
          'avg': time_elapsed,
          'count': 1
        };
      } else {
        var data = platform.metrics.code[key];
        data.avg = (data.avg * data.count + time_elapsed) / (++data.count);
        if (data.min > time_elapsed) {
          data.min = time_elapsed;
        }
        if (data.max < time_elapsed) {
          data.max = time_elapsed;
        }
      }
      if (platform.configuration.server.debugging.kernel.profile === true) {
        console.debug('code profile block %s required %s ms',key,time_elapsed);
      }
    })();
  }
};
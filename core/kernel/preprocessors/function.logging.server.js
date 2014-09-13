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

platform.kernel._preprocessors.server.function_logging = function(ast,code,file,module,preprocessor){

  var prepend_code = Function.info.code(_code_call_log_create_object, true);

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      switch(node.type){
        case 'FunctionExpression':
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
          if (node.body.type === 'BlockStatement' && node.body.body.length > 0){
            node.body.body[0].prepend.push(prepend_code);
          }
          break;
      }
    }
    node = node.tree.next;
  }
};

//T: add support log level for function logging

var _code_call_log_create_object = function() {
  if (global.bootstrap == null){
    if ((platform.configuration.server.debugging.kernel.function.named === true
      || (platform.configuration.server.debugging.kernel.function.named === false
      && (arguments.called != null && (arguments.called.name === 'unknown' || arguments.called.name.startsWith('{}') === true))))
      && (platform.configuration.server.debugging.kernel.function.unknown === true
        || (platform.configuration.server.debugging.kernel.function.unknown === false
          && (arguments.called != null && arguments.called.name !== 'unknown')))
      && (platform.configuration.server.debugging.kernel.function.object === true
        || (platform.configuration.server.debugging.kernel.function.object === false
          && (arguments.called != null && arguments.called.name.startsWith('{}') === false)))) {
      console.debug('function %s() called', (arguments.called != null) ? arguments.called.name : 'unknown');
    }
  }
};
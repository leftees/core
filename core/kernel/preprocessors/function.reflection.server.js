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

platform.kernel._preprocessors.server.function_reflection = function(ast,code,file,module,preprocessor){

  var prepend_code = Function.info.code(_code_reflection_create_object, true);

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1){
      skip = true;
    }
    if (skip === false) {
      switch(node.type){
        case 'FunctionExpression':
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
          if (node.body.type === 'BlockStatement' && node.body.body.length > 0){
            var function_name = node._name || 'unknown';
            var function_params = [];
            node.params.forEach(function(param){
              function_params.push(param.name);
            });
            if (function_params.length > 0){
              function_params = '\'' + function_params.join('\', \'') + '\'';
            } else {
              function_params = '';
            }
            var function_vars = [];
            native.parser.js.traverse(node,{
              'enter': function(child_node,parent) {
                if (child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      function_vars.push(child_node.id.name);
                      break;
                  }
                }
              }
            });
            if (function_vars.length > 0){
              function_vars = '\'' + function_vars.join('\', \'') + '\'';
            } else {
              function_vars = '';
            }
            prepend_code = prepend_code.replace('$+0',function_name);
            prepend_code = prepend_code.replace('$+1',function_params);
            prepend_code = prepend_code.replace('$+2',function_vars);
            node.body.body[0].prepend.push(prepend_code);
          }
          break;
      }
    }
    node = node.tree.next;
  }
};

var _code_reflection_create_object = function() {
  var __callee_ = {
    'name': '$+0',
    'params': [ $+1 ],
    'vars': [ $+2 ]
  };
};
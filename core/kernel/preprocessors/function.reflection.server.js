/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

platform.kernel._preprocessors.server[2].function_reflection = function(ast,code,file,module,preprocessor){

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
            var function_name = node._name || 'unknown';
            var function_params = [];
            node.params.forEach(function(param){
              function_params.push({
                'type': 'Literal',
                'value': param.name,
                'raw': '\''+param.name+'\''
              });
            });
            var function_vars = [];
            native.parser.js.traverse(node,{
              'enter': function(child_node,parent) {
                if (child_node.tree != null && child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      function_vars.push({
                        'type': 'Literal',
                        'value': child_node.id.name,
                        'raw': '\''+child_node.id.name+'\''
                      });
                      break;
                  }
                }
              }
            });
            /* injecting:
              arguments.called = {
               'name': '$function_name',
               'function': arguments.callee,
               'params': '[]function_params',
               'vars': '[]function_vars'
              };
            */
            var prepend_node = {
              'type': 'ExpressionStatement',
              'expression': {
                'type': 'AssignmentExpression',
                'operator': '=',
                'left': {
                  'type': 'MemberExpression',
                  'computed': false,
                  'object': {
                    'type': 'Identifier',
                    'name': 'arguments'
                  },
                  'property': {
                    'type': 'Identifier',
                    'name': 'called'
                  }
                },
                'right': {
                  'type': 'ObjectExpression',
                  'properties': [
                    {
                      'type': 'Property',
                      'key': {
                        'type': 'Literal',
                        'value': 'name',
                        'raw': '\'name\''
                      },
                      'value': {
                        'type': 'Literal',
                        'value': function_name,
                        'raw': '\''+function_name+'\''
                      },
                      'kind': 'init'
                    },
                    {
                      'type': 'Property',
                      'key': {
                        'type': 'Literal',
                        'value': 'function',
                        'raw': '\'function\''
                      },
                      'value': {
                        'type': 'MemberExpression',
                        'computed': false,
                        'object': {
                          'type': 'Identifier',
                          'name': 'arguments'
                        },
                        'property': {
                          'type': 'Identifier',
                          'name': 'callee'
                        }
                      },
                      'kind': 'init'
                    },
                    {
                      'type': 'Property',
                      'key': {
                        'type': 'Literal',
                        'value': 'params',
                        'raw': '\'params\''
                      },
                      'value': {
                        'type': 'ArrayExpression',
                        'elements': function_vars
                      },
                      'kind': 'init'
                    },
                    {
                      'type': 'Property',
                      'key': {
                        'type': 'Literal',
                        'value': 'vars',
                        'raw': '\'vars\''
                      },
                      'value': {
                        'type': 'ArrayExpression',
                        'elements': function_vars
                      },
                      'kind': 'init'
                    }
                  ]
                }
              }
            };
            node.body.body.unshift(prepend_node);
          }
          break;
      }
    }
    node = node.tree.next;
  }
};
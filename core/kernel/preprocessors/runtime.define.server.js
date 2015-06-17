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

platform.kernel._preprocessors.server[2].runtime_define = function(ast,code,file,module,preprocessor){

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      if (node._tags != null && node._tags['runtime'] != null) {
        if (node._is_exec_block === true){
          if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.left.type === 'MemberExpression'){
            var name = node.expression.left._name;
            var left = node.expression.left;
            var right = node.expression.right;
            var property;
            if (left.property.type === 'Literal'){
              property = left.property.value;
            } else if (left.property.type === 'Identifier') {
              property = left.property.name;
            }
            if(name != null && property != null){
              // injecting: Object.defineProperty('$0',{ 'runtime': '$0' });
              var prepend_node = {
                'type': 'ExpressionStatement',
                'expression': {
                  'type': 'CallExpression',
                  'callee': {
                    'type': 'MemberExpression',
                    'computed': false,
                    'object': {
                      'type': 'Identifier',
                      'name': 'Object'
                    },
                    'property': {
                      'type': 'Identifier',
                      'name': 'defineProperty'
                    }
                  },
                  'arguments': [
                    {
                      'type': 'Literal',
                      'value': name,
                      'raw': '\'' + name + '\''
                    },
                    {
                      'type': 'ObjectExpression',
                      'properties': [
                        {
                          'type': 'Property',
                          'key': {
                            'type': 'Literal',
                            'value': 'runtime',
                            'raw': '\'runtime\''
                          },
                          'value': {
                            'type': 'Literal',
                            'value': name,
                            'raw': '\'' + name + '\''
                          },
                          'kind': 'init',
                          'method': false,
                          'shorthand': false
                        }
                      ]
                    }
                  ]
                }
              };
              node.tree.container.splice(node.tree.container.indexOf(node)+1,0,prepend_node);
            }
          }
        }
      }
    }
    node = node.tree.next;
  }
};
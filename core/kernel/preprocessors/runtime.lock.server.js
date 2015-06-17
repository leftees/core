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

platform.kernel._preprocessors.server[2].runtime_lock = function(ast,code,file,module,preprocessor){
  var node = ast;
  var init_scopes = [];
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)) {
      skip = true;
    }
    if (skip === false) {
      if (node._tags != null && node._tags['lock'] != null && node._tags['lock'].length === 1) {
        if (node._is_exec_block === true) {
          if ((node.tree.scope.type === 'FunctionExpression' || node.tree.scope.type === 'FunctionDeclaration' ||
            node.tree.scope.type === 'ArrowFunctionExpression' || node.tree.scope.type === 'ArrowExpression') && node.tree.scope.async === true){
            // injecting: var __lock_ids = [];
            var init_node = {
              'type': 'VariableDeclaration',
              'declarations': [
                {
                  'type': 'VariableDeclarator',
                  'id': {
                    'type': 'Identifier',
                    'name': '__lock_ids'
                  },
                  'init': {
                    'type': 'ArrayExpression',
                    'elements': []
                  }
                }
              ],
              'kind': 'var'
            };
            // injecting: __lock_ids.push(await runtime.waitAndLock($0));
            var prepend_node = {
              'type': 'ExpressionStatement',
              'expression': {
                'type': 'CallExpression',
                'callee': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': '__lock_ids'
                  },
                  'property': {
                    'type': 'Identifier',
                    'name': 'push'
                  },
                  'computed': false
                },
                'arguments': [{
                  'type': 'AwaitExpression',
                  'all': false,
                  'argument': {
                    'type': 'CallExpression',
                    'callee': {
                      'type': 'MemberExpression',
                      'object': {
                        'type': 'Identifier',
                        'name': 'runtime'
                      },
                      'property': {
                        'type': 'Identifier',
                        'name': 'waitAndLock'
                      },
                      'computed': false
                    },
                    'arguments': [{
                      'type': 'Literal',
                      'value': node._tags['lock'][0],
                      'raw': '\'' + node._tags['lock'][0] + '\''
                    }]
                  }
                }]
              }
            };
            // injecting: runtime.unlock($0, __lock_ids.shift());
            var append_node = {
              'type': 'ExpressionStatement',
              'expression': {
                'type': 'CallExpression',
                'callee': {
                  'type': 'MemberExpression',
                  'computed': false,
                  'object': {
                    'type': 'Identifier',
                    'name': 'runtime'
                  },
                  'property': {
                    'type': 'Identifier',
                    'name': 'unlock'
                  }
                },
                'arguments': [
                  {
                    'type': 'Literal',
                    'value': node._tags['lock'][0],
                    'raw': '\'' + node._tags['lock'][0] + '\''
                  },
                  {
                    'type': 'CallExpression',
                    'callee': {
                      'type': 'MemberExpression',
                      'computed': false,
                      'object': {
                        'type': 'Identifier',
                        'name': '__lock_ids'
                      },
                      'property': {
                        'type': 'Identifier',
                        'name': 'shift'
                      }
                    },
                    'arguments': []
                  }
                ]
              }
            };
            if (init_scopes.indexOf(node.tree.container) === -1) {
              node.tree.container.unshift(init_node);
              init_scopes.push(node.tree.container);
            }
            node.tree.container.splice(node.tree.container.indexOf(node)+1,0,append_node);
            node.tree.container.splice(node.tree.container.indexOf(node),0,prepend_node);
          }
          /* injecting:
           runtime.waitAndLock('$0',(function(__lockid_){
           ...
           runtime.unlock('$0', lockid);
           }).bind(this));*/
          /*var wrapper_node = {
            'type': 'ExpressionStatement',
            'expression': {
              'type': 'CallExpression',
              'callee': {
                'type': 'MemberExpression',
                'computed': false,
                'object': {
                  'type': 'Identifier',
                  'name': 'runtime'
                },
                'property': {
                  'type': 'Identifier',
                  'name': 'waitAndLock'
                }
              },
              'arguments': [
                {
                  'type': 'Literal',
                  'value': node._tags['lock'][0],
                  'raw': '\'' + node._tags['lock'][0] + '\''
                },
                {
                  'type': 'CallExpression',
                  'callee': {
                    'type': 'MemberExpression',
                    'computed': false,
                    'object': {
                      'type': 'FunctionExpression',
                      'id': null,
                      'params': [
                        {
                          'type': 'Identifier',
                          'name': '__lockid_'
                        }
                      ],
                      'defaults': [],
                      'body': {
                        'type': 'BlockStatement',
                        'body': [
                          node,
                          {
                            'type': 'ExpressionStatement',
                            'expression': {
                              'type': 'CallExpression',
                              'callee': {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                  'type': 'Identifier',
                                  'name': 'runtime'
                                },
                                'property': {
                                  'type': 'Identifier',
                                  'name': 'unlock'
                                }
                              },
                              'arguments': [
                                {
                                  'type': 'Literal',
                                  'value': node._tags['lock'][0],
                                  'raw': '\'' + node._tags['lock'][0] + '\''
                                },
                                {
                                  'type': 'Identifier',
                                  'name': '__lockid_'
                                }
                              ]
                            }
                          }
                        ]
                      },
                      'rest': null,
                      'generator': false,
                      'expression': false,
                      'async': true
                    },
                    'property': {
                      'type': 'Identifier',
                      'name': 'bind'
                    }
                  },
                  'arguments': [
                    {
                      'type': 'ThisExpression'
                    }
                  ]
                }
              ]
            }
          };
          node.tree.container.splice(node.tree.container.indexOf(node), 1, wrapper_node);*/
        }
      }
    }
    node = node.tree.next;
  }
};
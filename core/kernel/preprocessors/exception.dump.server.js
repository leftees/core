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

platform.kernel._preprocessors.server[2].exception_dump = function(ast,code,file,module,preprocessor){

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node._tags != null && node._tags['preprocessor.disable'] != null && (node._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node._tags['preprocessor.disable'].length === 0 || node._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      var function_dump = null;
      var function_varnames = null;
      switch(node.type){
        //TODO: avoid code duplication
        /*case 'Program':
          if (node.body.length > 0) {
            function_dump = [];
            [ 'exports', '__filename', '__dirname'].forEach(function(param){
              function_dump.push('\'' + param + '\': ' + param);
            });
            function_varnames = [];
            native.parser.js.traverse(node, {
              'enter': function (child_node, parent) {
                if (child_node.tree != null && child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      if(function_varnames.indexOf(child_node.id.name) === -1) {
                        function_varnames.push(child_node.id.name);
                        function_dump.push('\'' + child_node.id.name + '\': ' + child_node.id.name);
                      }
                      break;
                  }
                }
              }
            });
            function_varnames = null;
          }
          break;*/
        case 'FunctionExpression':
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
          if (node.body.type === 'BlockStatement' && node.body.body.length > 0){
            function_dump = [];
            node.params.forEach(function(param){
              function_dump.push('\'' + param.name + '\': ' + param.name);
            });
            function_varnames = [];
            native.parser.js.traverse(node,{
              'enter': function(child_node,parent) {
                if (child_node.tree != null && child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      if(function_varnames.indexOf(child_node.id.name) === -1) {
                        function_varnames.push(child_node.id.name);
                        function_dump.push('\'' + child_node.id.name + '\': ' + child_node.id.name);
                      }
                      break;
                  }
                }
              }
            });
            function_varnames = null;
          }
          break;
      }
      if (function_dump != null){
        if (function_dump.length > 0){
          function_dump = '({' + function_dump.join(', ') + '})';
        } else {
          function_dump = '({})';
        }
        /* injecting:
          try {
          } catch (__exception_inner_){
            if(__exception_inner_.dump != null && platform.configuration.kernel.exception.inner === false) {
              throw __exception_inner_;
            }
            (function(called){
              var __exception_ = new Exception(__exception_inner_);
              __exception_.inner = __exception_inner_;
              __exception_.date = new Date();
              __exception_.dump = {};
              __exception_.function = called;
              try{
                var exception_location = platform.kernel._debugger.getExceptionLocationFromStack(__exception_.stack);
                __exception_.block = platform.kernel._debugger.getBlockFromLocation(exception_location);
              } catch(e) {}
              __exception_.block = __exception_.block || {};
              if (platform.configuration.debug.exception === true){
                console.error('uncaught exception: ', __exception_.stack || __exception_.message);
                console.dir(__exception_.toJSON());
              }
              throw __exception_;
            })(arguments.called);
          }
        */
        var prepend_node = {
          'type': 'TryStatement',
          'block': {
            'type': 'BlockStatement',
            'body': []
          },
          'guardedHandlers': [],
          'handlers': [
            {
              'type': 'CatchClause',
              'param': {
                'type': 'Identifier',
                'name': '__exception_inner_'
              },
              'body': {
                'type': 'BlockStatement',
                'body': [{
                  "type": "IfStatement",
                  "test": {
                    "type": "LogicalExpression",
                    "operator": "&&",
                    "left": {
                      "type": "BinaryExpression",
                      "operator": "!=",
                      "left": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                          "type": "Identifier",
                          "name": "__exception_inner_"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "dump"
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": null,
                        "raw": "null"
                      }
                    },
                    "right": {
                      "type": "BinaryExpression",
                      "operator": "===",
                      "left": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                          "type": "MemberExpression",
                          "computed": false,
                          "object": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                              "type": "MemberExpression",
                              "computed": false,
                              "object": {
                                "type": "Identifier",
                                "name": "platform"
                              },
                              "property": {
                                "type": "Identifier",
                                "name": "configuration"
                              }
                            },
                            "property": {
                              "type": "Identifier",
                              "name": "kernel"
                            }
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "exception"
                          }
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "inner"
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": false,
                        "raw": "false"
                      }
                    }
                  },
                  "consequent": {
                    "type": "BlockStatement",
                    "body": [
                      {
                        "type": "ThrowStatement",
                        "argument": {
                          "type": "Identifier",
                          "name": "__exception_inner_"
                        }
                      }
                    ]
                  },
                  "alternate": null
                },
                {
                  'type': 'ExpressionStatement',
                  'expression': {
                    'type': 'CallExpression',
                    'callee': {
                      'type': 'FunctionExpression',
                      'id': null,
                      'params': [
                        {
                          "type": "Identifier",
                          "name": "called"
                        }
                      ],
                      'defaults': [],
                      'body': {
                        'type': 'BlockStatement',
                        'body': [
                          {
                            "type": "VariableDeclaration",
                            "declarations": [
                              {
                                "type": "VariableDeclarator",
                                "id": {
                                  "type": "Identifier",
                                  "name": "__exception_"
                                },
                                "init": {
                                  "type": "NewExpression",
                                  "callee": {
                                    "type": "Identifier",
                                    "name": "Exception"
                                  },
                                  "arguments": [
                                    {
                                      "type": "Identifier",
                                      "name": "__exception_inner_"
                                    }
                                  ]
                                }
                              }
                            ],
                            "kind": "var"
                          },
                          {
                            "type": "ExpressionStatement",
                            "expression": {
                              "type": "AssignmentExpression",
                              "operator": "=",
                              "left": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "name": "__exception_"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "inner"
                                }
                              },
                              "right": {
                                "type": "Identifier",
                                "name": "__exception_inner_"
                              }
                            }
                          },
                          {
                            'type': 'ExpressionStatement',
                            'expression': {
                              'type': 'AssignmentExpression',
                              'operator': '=',
                              'left': {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                  'type': 'Identifier',
                                  'name': '__exception_'
                                },
                                'property': {
                                  'type': 'Identifier',
                                  'name': 'date'
                                }
                              },
                              'right': {
                                'type': 'NewExpression',
                                'callee': {
                                  'type': 'Identifier',
                                  'name': 'Date'
                                },
                                'arguments': []
                              }
                            }
                          },
                          {
                            'type': 'ExpressionStatement',
                            'expression': {
                              'type': 'AssignmentExpression',
                              'operator': '=',
                              'left': {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                  'type': 'Identifier',
                                  'name': '__exception_'
                                },
                                'property': {
                                  'type': 'Identifier',
                                  'name': 'dump'
                                }
                              },
                              'right': native.parser.js.parse(function_dump).body[0].expression
                            }
                          },
                          {
                            'type': 'ExpressionStatement',
                            'expression': {
                              'type': 'AssignmentExpression',
                              'operator': '=',
                              'left': {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                  'type': 'Identifier',
                                  'name': '__exception_'
                                },
                                'property': {
                                  'type': 'Identifier',
                                  'name': 'function'
                                }
                              },
                              'right': {
                                  'type': 'Identifier',
                                  'name': 'called'
                              }
                            }
                          },
                          {
                            "type": "TryStatement",
                            "block": {
                              "type": "BlockStatement",
                              "body": [
                                {
                                  "type": "VariableDeclaration",
                                  "declarations": [
                                    {
                                      "type": "VariableDeclarator",
                                      "id": {
                                        "type": "Identifier",
                                        "name": "exception_location"
                                      },
                                      "init": {
                                        "type": "CallExpression",
                                        "callee": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": {
                                              "type": "MemberExpression",
                                              "computed": false,
                                              "object": {
                                                "type": "Identifier",
                                                "name": "platform"
                                              },
                                              "property": {
                                                "type": "Identifier",
                                                "name": "kernel"
                                              }
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "_debugger"
                                            }
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "getExceptionLocationFromStack"
                                          }
                                        },
                                        "arguments": [
                                          {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": {
                                              "type": "Identifier",
                                              "name": "__exception_"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "stack"
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  ],
                                  "kind": "var"
                                },
                                {
                                  "type": "ExpressionStatement",
                                  "expression": {
                                    "type": "AssignmentExpression",
                                    "operator": "=",
                                    "left": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "Identifier",
                                        "name": "__exception_"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "block"
                                      }
                                    },
                                    "right": {
                                      "type": "CallExpression",
                                      "callee": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": {
                                              "type": "Identifier",
                                              "name": "platform"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "kernel"
                                            }
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "_debugger"
                                          }
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "getBlockFromLocation"
                                        }
                                      },
                                      "arguments": [
                                        {
                                          "type": "Identifier",
                                          "name": "exception_location"
                                        }
                                      ]
                                    }
                                  }
                                }
                              ]
                            },
                            "guardedHandlers": [],
                            "handlers": [
                              {
                                "type": "CatchClause",
                                "param": {
                                  "type": "Identifier",
                                  "name": "e"
                                },
                                "body": {
                                  "type": "BlockStatement",
                                  "body": [
                                  ]
                                }
                              }
                            ],
                            "handler": {
                              "type": "CatchClause",
                              "param": {
                                "type": "Identifier",
                                "name": "e"
                              },
                              "body": {
                                "type": "BlockStatement",
                                "body": [
                                  {
                                    "type": "ExpressionStatement",
                                    "expression": {
                                      "type": "AssignmentExpression",
                                      "operator": "=",
                                      "left": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                          "type": "Identifier",
                                          "name": "__exception_"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "block"
                                        }
                                      },
                                      "right": {
                                        "type": "Literal",
                                        "value": "",
                                        "raw": "''"
                                      }
                                    }
                                  }
                                ]
                              }
                            },
                            "finalizer": null
                          },
                          {
                            "type": "ExpressionStatement",
                            "expression": {
                              "type": "AssignmentExpression",
                              "operator": "=",
                              "left": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "name": "__exception_"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "block"
                                }
                              },
                              "right": {
                                "type": "LogicalExpression",
                                "operator": "||",
                                "left": {
                                  "type": "MemberExpression",
                                  "computed": false,
                                  "object": {
                                    "type": "Identifier",
                                    "name": "__exception_"
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "block"
                                  }
                                },
                                "right": {
                                  "type": "ObjectExpression",
                                  "properties": []
                                }
                              }
                            }
                          },
                          {
                            "type": "IfStatement",
                            "test": {
                              "type": "BinaryExpression",
                              "operator": "===",
                              "left": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                  "type": "MemberExpression",
                                  "computed": false,
                                  "object": {
                                    "type": "MemberExpression",
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "name": "platform"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "configuration"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "debug"
                                  }
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "exception"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "value": true,
                                "raw": "true"
                              }
                            },
                            "consequent": {
                              "type": "BlockStatement",
                              "body": [
                                {
                                  "type": "ExpressionStatement",
                                  "expression": {
                                    "type": "CallExpression",
                                    "callee": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "Identifier",
                                        "name": "console"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "error"
                                      }
                                    },
                                    "arguments": [
                                      {
                                        "type": "Literal",
                                        "value": "uncaught exception: ",
                                        "raw": "'uncaught exception: '"
                                      },
                                      {
                                        "type": "LogicalExpression",
                                        "operator": "||",
                                        "left": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "Identifier",
                                            "name": "__exception_"
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "stack"
                                          }
                                        },
                                        "right": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "Identifier",
                                            "name": "__exception_"
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "message"
                                          }
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  "type": "ExpressionStatement",
                                  "expression": {
                                    "type": "CallExpression",
                                    "callee": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "Identifier",
                                        "name": "console"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "dir"
                                      }
                                    },
                                    "arguments": [
                                      {
                                        "type": "CallExpression",
                                        "callee": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "Identifier",
                                            "name": "__exception_"
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "toJSON"
                                          }
                                        },
                                        "arguments": []
                                      }
                                    ]
                                  }
                                }
                              ]
                            },
                            "alternate": null
                          },
                          {
                            'type': 'ThrowStatement',
                            'argument': {
                              'type': 'Identifier',
                              'name': '__exception_'
                            }
                          }
                        ]
                      },
                      'rest': null,
                      'generator': false,
                      'expression': false
                    },
                    'arguments': [
                      {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                          "type": "Identifier",
                          "name": "arguments"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "called"
                        }
                      }
                    ]
                  }
                }]
              }
            }
          ],
          'finalizer': null
        };
        /*if (node.type === 'Program'){
          prepend_node.block.body = node.body;
          node.body = [ prepend_node ];
        } else {*/
          prepend_node.block.body = node.body.body;
          node.body.body = [ prepend_node ];
        //}
        prepend_node.block.body.forEach(function(child_node){
          if (child_node.tree != null) {
            child_node.tree.container = prepend_node.block.body;
          }
        });
      }
    }
    node = node.tree.next;
  }
};

//TODO: push/store exception data somewhere
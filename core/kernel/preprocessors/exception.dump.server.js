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

platform.kernel._preprocessors.server[2].exception_dump = function(ast,code,file,module,preprocessor){

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      var function_dump = null;
      switch(node.type){
        //T: avoid code duplication
        case 'Program':
          if (node.body.length > 0) {
            function_dump = [];
            native.parser.js.traverse(node, {
              'enter': function (child_node, parent) {
                if (child_node.tree != null && child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      function_dump.push('\'' + child_node.id.name + '\': ' + child_node.id.name);
                      break;
                  }
                }
              }
            });
          }
          break;
        case 'FunctionExpression':
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
          if (node.body.type === 'BlockStatement' && node.body.body.length > 0){
            function_dump = [];
            node.params.forEach(function(param){
              function_dump.push('\'' + param.name + '\': ' + param.name);
            });
            native.parser.js.traverse(node,{
              'enter': function(child_node,parent) {
                if (child_node.tree != null && child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      function_dump.push('\'' + child_node.id.name + '\': ' + child_node.id.name);
                      break;
                  }
                }
              }
            });
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
          } catch (__exception_){
            (function(){
              __exception_.date = new Date();
              __exception_.dump = {};
              try {
                var __function_code_ = arguments.callee.caller.toString();
                if (__function_code_.endsWith('[native code] }') === false) {
                  __exception_.block = __function_code_.match(new RegExp('__c_\\s*=\\s*' + __c_ + ';[\\n\\s]*(.*?)[\\n\\s]*(;[\\n\\s]*__c_\\s*=\\s*' + (__c_ + 1) + ';|;[\\n\\s]*\})'))[1];
                }
              } catch(err){}
              __exception_.called = arguments.called;
              throw __exception_;
            })();
          }
        */
        var prepend_node = {
          "type": "TryStatement",
          "block": {
            "type": "BlockStatement",
            "body": []
          },
          "guardedHandlers": [],
          "handlers": [
            {
              "type": "CatchClause",
              "param": {
                "type": "Identifier",
                "name": "__exception_"
              },
              "body": {
                "type": "BlockStatement",
                "body": [{
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "CallExpression",
                    "callee": {
                      "type": "FunctionExpression",
                      "id": null,
                      "params": [],
                      "defaults": [],
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
                                  "name": "date"
                                }
                              },
                              "right": {
                                "type": "NewExpression",
                                "callee": {
                                  "type": "Identifier",
                                  "name": "Date"
                                },
                                "arguments": []
                              }
                            }
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
                                  "name": "dump"
                                }
                              },
                              "right": native.parser.js.parse(function_dump).body[0].expression
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
                                        "name": "__function_code_"
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
                                                "name": "arguments"
                                              },
                                              "property": {
                                                "type": "Identifier",
                                                "name": "callee"
                                              }
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "caller"
                                            }
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "toString"
                                          }
                                        },
                                        "arguments": []
                                      }
                                    }
                                  ],
                                  "kind": "var"
                                },
                                {
                                  "type": "IfStatement",
                                  "test": {
                                    "type": "BinaryExpression",
                                    "operator": "===",
                                    "left": {
                                      "type": "CallExpression",
                                      "callee": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                          "type": "Identifier",
                                          "name": "__function_code_"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "endsWith"
                                        }
                                      },
                                      "arguments": [
                                        {
                                          "type": "Literal",
                                          "value": "[native code] }",
                                          "raw": "'[native code] }'"
                                        }
                                      ]
                                    },
                                    "right": {
                                      "type": "Literal",
                                      "value": false,
                                      "raw": "false"
                                    }
                                  },
                                  "consequent": {
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
                                            "type": "MemberExpression",
                                            "computed": true,
                                            "object": {
                                              "type": "CallExpression",
                                              "callee": {
                                                "type": "MemberExpression",
                                                "computed": false,
                                                "object": {
                                                  "type": "Identifier",
                                                  "name": "__function_code_"
                                                },
                                                "property": {
                                                  "type": "Identifier",
                                                  "name": "match"
                                                }
                                              },
                                              "arguments": [
                                                {
                                                  "type": "NewExpression",
                                                  "callee": {
                                                    "type": "Identifier",
                                                    "name": "RegExp"
                                                  },
                                                  "arguments": [
                                                    {
                                                      "type": "BinaryExpression",
                                                      "operator": "+",
                                                      "left": {
                                                        "type": "BinaryExpression",
                                                        "operator": "+",
                                                        "left": {
                                                          "type": "BinaryExpression",
                                                          "operator": "+",
                                                          "left": {
                                                            "type": "BinaryExpression",
                                                            "operator": "+",
                                                            "left": {
                                                              "type": "Literal",
                                                              "value": "__c_\\s*=\\s*",
                                                              "raw": "'__c_\\\\s*=\\\\s*'"
                                                            },
                                                            "right": {
                                                              "type": "Identifier",
                                                              "name": "__c_"
                                                            }
                                                          },
                                                          "right": {
                                                            "type": "Literal",
                                                            "value": ";[\\n\\s]*(.*?)[\\n\\s]*(;[\\n\\s]*__c_\\s*=\\s*",
                                                            "raw": "';[\\\\n\\\\s]*(.*?)[\\\\n\\\\s]*(;[\\n\\s]*__c_\\\\s*=\\\\s*'"
                                                          }
                                                        },
                                                        "right": {
                                                          "type": "BinaryExpression",
                                                          "operator": "+",
                                                          "left": {
                                                            "type": "Identifier",
                                                            "name": "__c_"
                                                          },
                                                          "right": {
                                                            "type": "Literal",
                                                            "value": 1,
                                                            "raw": "1"
                                                          }
                                                        }
                                                      },
                                                      "right": {
                                                        "type": "Literal",
                                                        "value": ";|;[\\n\\s]*})",
                                                        "raw": "';|;[\\\\n\\\\s]*\\})'"
                                                      }
                                                    }
                                                  ]
                                                }
                                              ]
                                            },
                                            "property": {
                                              "type": "Literal",
                                              "value": 1,
                                              "raw": "1"
                                            }
                                          }
                                        }
                                      }
                                    ]
                                  },
                                  "alternate": null
                                }
                              ]
                            },
                            "guardedHandlers": [],
                            "handlers": [
                              {
                                "type": "CatchClause",
                                "param": {
                                  "type": "Identifier",
                                  "name": "err"
                                },
                                "body": {
                                  "type": "BlockStatement",
                                  "body": []
                                }
                              }
                            ],
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
                                  "name": "called"
                                }
                              },
                              "right": {
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
                            }
                          },
                          {
                            "type": "ThrowStatement",
                            "argument": {
                              "type": "Identifier",
                              "name": "__exception_"
                            }
                          }
                        ]
                      },
                      "rest": null,
                      "generator": false,
                      "expression": false
                    },
                    "arguments": []
                  }
                }]
              }
            }
          ],
          "finalizer": null
        };
        if (node.type === 'Program'){
          prepend_node.block.body = node.body;
          node.body = [ prepend_node ];
        } else{
          prepend_node.block.body = node.body.body;
          node.body.body = [ prepend_node ];
        }
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

//T: push/store exception data somewhere
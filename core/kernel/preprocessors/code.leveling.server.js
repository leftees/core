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

platform.kernel._preprocessors.server[2].code_leveling = function(ast,code,file,module,preprocessor){

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      if (node._tags != null && node._tags['runlevel'] != null && node._tags['runlevel'].length > 0) {
        node._tags['runlevel'].forEach(function(runlevel){
          platform.kernel.runlevels[runlevel] = platform.kernel.runlevels[runlevel] || false;
        });
        if (node._is_exec_block === true){
          var node_runlevels = [];
          node._tags['runlevel'].forEach(function(runlevel){
            node_runlevels.push({
              'type': 'Literal',
              'value': runlevel,
              'raw': '\''+runlevel+'\''
            });
          });
          var node_runlevels_condition = 'platform.kernel.runlevels[\'' + node._tags['runlevel'].join('\'] === true && platform.kernel.runlevels[\'') + '\'] === true';
          /* injecting:
           if(((platform.kernel.runlevels['$0'] === true) && platform.configuration.server.kernel.runlevel === true) || platform.configuration.server.kernel.runlevel === false){
           } else if (platform.configuration.server.debugging.kernel.runlevel === true) {
             (function () {
               var disabled_runlevels = ['$0'];
               disabled_runlevels = disabled_runlevels.filter(function(runlevel){
                return (platform.kernel.runlevels[runlevel] === false);
               });
               console.warn('code block at line %s in %s skipped because of runlevel%s %s', '$1', '$2', (disabled_runlevels.length > 1) ? 's' : '', disabled_runlevels.join(', '));
             })();
           }
          */
          var prepend_node = {
            "type": "IfStatement",
            "test": {
              "type": "LogicalExpression",
              "operator": "||",
              "left": {
                "type": "LogicalExpression",
                "operator": "&&",
                "left": native.parser.js.parse(node_runlevels_condition).body[0].expression,
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
                          "name": "server"
                        }
                      },
                      "property": {
                        "type": "Identifier",
                        "name": "kernel"
                      }
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "runlevel"
                    }
                  },
                  "right": {
                    "type": "Literal",
                    "value": true,
                    "raw": "true"
                  }
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
                        "name": "server"
                      }
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "kernel"
                    }
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "runlevel"
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
              "body": [ node ]
            },
            "alternate": {
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
                          "name": "server"
                        }
                      },
                      "property": {
                        "type": "Identifier",
                        "name": "debugging"
                      }
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "kernel"
                    }
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "runlevel"
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
                        "type": "FunctionExpression",
                        "id": null,
                        "params": [],
                        "defaults": [],
                        "body": {
                          "type": "BlockStatement",
                          "body": [
                            {
                              "type": "VariableDeclaration",
                              "declarations": [
                                {
                                  "type": "VariableDeclarator",
                                  "id": {
                                    "type": "Identifier",
                                    "name": "disabled_runlevels"
                                  },
                                  "init": {
                                    "type": "ArrayExpression",
                                    "elements": node_runlevels
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
                                  "type": "Identifier",
                                  "name": "disabled_runlevels"
                                },
                                "right": {
                                  "type": "CallExpression",
                                  "callee": {
                                    "type": "MemberExpression",
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "name": "disabled_runlevels"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "filter"
                                    }
                                  },
                                  "arguments": [
                                    {
                                      "type": "FunctionExpression",
                                      "id": null,
                                      "params": [
                                        {
                                          "type": "Identifier",
                                          "name": "runlevel"
                                        }
                                      ],
                                      "defaults": [],
                                      "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                          {
                                            "type": "ReturnStatement",
                                            "argument": {
                                              "type": "BinaryExpression",
                                              "operator": "===",
                                              "left": {
                                                "type": "MemberExpression",
                                                "computed": true,
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
                                                    "name": "runlevels"
                                                  }
                                                },
                                                "property": {
                                                  "type": "Identifier",
                                                  "name": "runlevel"
                                                }
                                              },
                                              "right": {
                                                "type": "Literal",
                                                "value": false,
                                                "raw": "false"
                                              }
                                            }
                                          }
                                        ]
                                      },
                                      "rest": null,
                                      "generator": false,
                                      "expression": false
                                    }
                                  ]
                                }
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
                                    "name": "warn"
                                  }
                                },
                                "arguments": [
                                  {
                                    "type": "Literal",
                                    "value": "code block at line %s in %s skipped because of runlevel%s %s",
                                    "raw": "'code block at line %s in %s skipped because of runlevel%s %s'"
                                  },
                                  {
                                    "type": "Literal",
                                    "value": node.loc.start.line,
                                    "raw": "\'"+node.loc.start.line+"\'"
                                  },
                                  {
                                    "type": "Literal",
                                    "value": (file == null) ? 'eval code' : ('file ' + file),
                                    "raw": '\''+(file == null) ? 'eval code' : ('file ' + file)+'\''
                                  },
                                  {
                                    "type": "ConditionalExpression",
                                    "test": {
                                      "type": "BinaryExpression",
                                      "operator": ">",
                                      "left": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                          "type": "Identifier",
                                          "name": "disabled_runlevels"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "length"
                                        }
                                      },
                                      "right": {
                                        "type": "Literal",
                                        "value": 1,
                                        "raw": "1"
                                      }
                                    },
                                    "consequent": {
                                      "type": "Literal",
                                      "value": "s",
                                      "raw": "'s'"
                                    },
                                    "alternate": {
                                      "type": "Literal",
                                      "value": "",
                                      "raw": "''"
                                    }
                                  },
                                  {
                                    "type": "CallExpression",
                                    "callee": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "Identifier",
                                        "name": "disabled_runlevels"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "join"
                                      }
                                    },
                                    "arguments": [
                                      {
                                        "type": "Literal",
                                        "value": ", ",
                                        "raw": "', '"
                                      }
                                    ]
                                  }
                                ]
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
                  }
                ]
              },
              "alternate": null
            }
          };
          node.tree.container.splice(node.tree.container.indexOf(node),1,prepend_node);
          node.tree.container = prepend_node.consequent.body;
        } else {
          console.warn('runlevel tag ignored for node at line %s in %s',node.loc.start.line,(file == null) ? 'eval code' : ('file ' + file));
        }
      }
    }
    node = node.tree.next;
  }
};

//O: Stores run levels supported in kernel.
platform.kernel.runlevels = {
  'debug': platform.runtime.debugging,
  'dev': platform.runtime.development
};
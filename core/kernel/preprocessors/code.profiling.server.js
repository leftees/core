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

platform.kernel._preprocessors.server[2].code_profile = function(ast,code,file,module,preprocessor){

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      if (node._tags != null && node._tags['profile'] != null) {
        if (node._is_exec_block === true){
          //T: append code to the closest safe node (backward)
          /* injecting
            if (platform.configuration.server.kernel.profile === true) {
              (function () {
                var time_start = Date.now();
                platform.kernel._preprocessors.server[2].code_profile._data.push(time_start);
              })();
            }
          */
          var prepend_node = {
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
                  "name": "profile"
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
                                  "name": "time_start"
                                },
                                "init": {
                                  "type": "CallExpression",
                                  "callee": {
                                    "type": "MemberExpression",
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "name": "Date"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "now"
                                    }
                                  },
                                  "arguments": []
                                }
                              }
                            ],
                            "kind": "var"
                          },
                          {
                            "type": "ExpressionStatement",
                            "expression": {
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
                                      "type": "MemberExpression",
                                      "computed": true,
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
                                              "name": "kernel"
                                            }
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "_preprocessors"
                                          }
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "server"
                                        }
                                      },
                                      "property": {
                                        "type": "Literal",
                                        "value": 2,
                                        "raw": "2"
                                      }
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "code_profile"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "_data"
                                  }
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "push"
                                }
                              },
                              "arguments": [
                                {
                                  "type": "Identifier",
                                  "name": "time_start"
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
          };
          /* injecting:
          if (platform.configuration.server.kernel.profile === true) {
            (function(){
              var key = '$0';
              var time_stop = Date.now();
              var time_start = platform.kernel._preprocessors.server[2].code_profile._data.pop();
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
          */
          var append_node = {
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
                  "name": "profile"
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
                                  "name": "key"
                                },
                                "init": {
                                  "type": "Literal",
                                  "value": node._tags['profile'][0],
                                  "raw": '\''+node._tags['profile'][0]+'\''
                                }
                              }
                            ],
                            "kind": "var"
                          },
                          {
                            "type": "VariableDeclaration",
                            "declarations": [
                              {
                                "type": "VariableDeclarator",
                                "id": {
                                  "type": "Identifier",
                                  "name": "time_stop"
                                },
                                "init": {
                                  "type": "CallExpression",
                                  "callee": {
                                    "type": "MemberExpression",
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "name": "Date"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "now"
                                    }
                                  },
                                  "arguments": []
                                }
                              }
                            ],
                            "kind": "var"
                          },
                          {
                            "type": "VariableDeclaration",
                            "declarations": [
                              {
                                "type": "VariableDeclarator",
                                "id": {
                                  "type": "Identifier",
                                  "name": "time_start"
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
                                          "type": "MemberExpression",
                                          "computed": true,
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
                                                  "name": "kernel"
                                                }
                                              },
                                              "property": {
                                                "type": "Identifier",
                                                "name": "_preprocessors"
                                              }
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "server"
                                            }
                                          },
                                          "property": {
                                            "type": "Literal",
                                            "value": 2,
                                            "raw": "2"
                                          }
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "code_profile"
                                        }
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "_data"
                                      }
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "pop"
                                    }
                                  },
                                  "arguments": []
                                }
                              }
                            ],
                            "kind": "var"
                          },
                          {
                            "type": "VariableDeclaration",
                            "declarations": [
                              {
                                "type": "VariableDeclarator",
                                "id": {
                                  "type": "Identifier",
                                  "name": "time_elapsed"
                                },
                                "init": {
                                  "type": "BinaryExpression",
                                  "operator": "-",
                                  "left": {
                                    "type": "Identifier",
                                    "name": "time_stop"
                                  },
                                  "right": {
                                    "type": "Identifier",
                                    "name": "time_start"
                                  }
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
                                        "name": "metrics"
                                      }
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "code"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "hasOwnProperty"
                                  }
                                },
                                "arguments": [
                                  {
                                    "type": "Identifier",
                                    "name": "key"
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
                                            "name": "metrics"
                                          }
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "code"
                                        }
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "key"
                                      }
                                    },
                                    "right": {
                                      "type": "ObjectExpression",
                                      "properties": [
                                        {
                                          "type": "Property",
                                          "key": {
                                            "type": "Literal",
                                            "value": "min",
                                            "raw": "'min'"
                                          },
                                          "value": {
                                            "type": "Identifier",
                                            "name": "time_elapsed"
                                          },
                                          "kind": "init"
                                        },
                                        {
                                          "type": "Property",
                                          "key": {
                                            "type": "Literal",
                                            "value": "max",
                                            "raw": "'max'"
                                          },
                                          "value": {
                                            "type": "Identifier",
                                            "name": "time_elapsed"
                                          },
                                          "kind": "init"
                                        },
                                        {
                                          "type": "Property",
                                          "key": {
                                            "type": "Literal",
                                            "value": "avg",
                                            "raw": "'avg'"
                                          },
                                          "value": {
                                            "type": "Identifier",
                                            "name": "time_elapsed"
                                          },
                                          "kind": "init"
                                        },
                                        {
                                          "type": "Property",
                                          "key": {
                                            "type": "Literal",
                                            "value": "count",
                                            "raw": "'count'"
                                          },
                                          "value": {
                                            "type": "Literal",
                                            "value": 1,
                                            "raw": "1"
                                          },
                                          "kind": "init"
                                        }
                                      ]
                                    }
                                  }
                                }
                              ]
                            },
                            "alternate": {
                              "type": "BlockStatement",
                              "body": [
                                {
                                  "type": "VariableDeclaration",
                                  "declarations": [
                                    {
                                      "type": "VariableDeclarator",
                                      "id": {
                                        "type": "Identifier",
                                        "name": "data"
                                      },
                                      "init": {
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
                                              "name": "metrics"
                                            }
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "code"
                                          }
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "key"
                                        }
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
                                        "name": "data"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "avg"
                                      }
                                    },
                                    "right": {
                                      "type": "BinaryExpression",
                                      "operator": "/",
                                      "left": {
                                        "type": "BinaryExpression",
                                        "operator": "+",
                                        "left": {
                                          "type": "BinaryExpression",
                                          "operator": "*",
                                          "left": {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": {
                                              "type": "Identifier",
                                              "name": "data"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "avg"
                                            }
                                          },
                                          "right": {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": {
                                              "type": "Identifier",
                                              "name": "data"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "count"
                                            }
                                          }
                                        },
                                        "right": {
                                          "type": "Identifier",
                                          "name": "time_elapsed"
                                        }
                                      },
                                      "right": {
                                        "type": "UpdateExpression",
                                        "operator": "++",
                                        "argument": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "Identifier",
                                            "name": "data"
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "count"
                                          }
                                        },
                                        "prefix": true
                                      }
                                    }
                                  }
                                },
                                {
                                  "type": "IfStatement",
                                  "test": {
                                    "type": "BinaryExpression",
                                    "operator": ">",
                                    "left": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "Identifier",
                                        "name": "data"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "min"
                                      }
                                    },
                                    "right": {
                                      "type": "Identifier",
                                      "name": "time_elapsed"
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
                                              "name": "data"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "min"
                                            }
                                          },
                                          "right": {
                                            "type": "Identifier",
                                            "name": "time_elapsed"
                                          }
                                        }
                                      }
                                    ]
                                  },
                                  "alternate": null
                                },
                                {
                                  "type": "IfStatement",
                                  "test": {
                                    "type": "BinaryExpression",
                                    "operator": "<",
                                    "left": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "Identifier",
                                        "name": "data"
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "max"
                                      }
                                    },
                                    "right": {
                                      "type": "Identifier",
                                      "name": "time_elapsed"
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
                                              "name": "data"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "name": "max"
                                            }
                                          },
                                          "right": {
                                            "type": "Identifier",
                                            "name": "time_elapsed"
                                          }
                                        }
                                      }
                                    ]
                                  },
                                  "alternate": null
                                }
                              ]
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
                                  "name": "profile"
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
                                        "name": "debug"
                                      }
                                    },
                                    "arguments": [
                                      {
                                        "type": "Literal",
                                        "value": "code profile block %s required %s ms",
                                        "raw": "'code profile block %s required %s ms'"
                                      },
                                      {
                                        "type": "Identifier",
                                        "name": "key"
                                      },
                                      {
                                        "type": "Identifier",
                                        "name": "time_elapsed"
                                      }
                                    ]
                                  }
                                }
                              ]
                            },
                            "alternate": null
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
          };
          node.tree.container.splice(node.tree.container.indexOf(node)+1,0,append_node);
          node.tree.container.splice(node.tree.container.indexOf(node),0,prepend_node);
        } else {
          console.warn('profile tag ignored for node at line %s in %s',node.loc.start.line,(file == null) ? 'eval code' : ('file ' + file));
        }
      }
    }
    node = node.tree.next;
  }
};

platform.kernel._preprocessors.server[2].code_profile._data = [];

platform.metrics = platform.metrics || {};

platform.metrics.code = platform.metrics.code || {};
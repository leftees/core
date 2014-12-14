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

platform.kernel._preprocessors.server[2].function_logging = function(ast,code,file,module,preprocessor){

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
            /* injecting:
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
            */
            var prepend_node = {
              "type": "IfStatement",
              "test": {
                "type": "BinaryExpression",
                "operator": "==",
                "left": {
                  "type": "MemberExpression",
                  "computed": false,
                  "object": {
                    "type": "Identifier",
                    "name": "global"
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "bootstrap"
                  }
                },
                "right": {
                  "type": "Literal",
                  "value": null,
                  "raw": "null"
                }
              },
              "consequent": {
                "type": "BlockStatement",
                "body": [
                  {
                    "type": "IfStatement",
                    "test": {
                      "type": "LogicalExpression",
                      "operator": "&&",
                      "left": {
                        "type": "LogicalExpression",
                        "operator": "&&",
                        "left": {
                          "type": "LogicalExpression",
                          "operator": "||",
                          "left": {
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
                                  "name": "function"
                                }
                              },
                              "property": {
                                "type": "Identifier",
                                "name": "named"
                              }
                            },
                            "right": {
                              "type": "Literal",
                              "value": true,
                              "raw": "true"
                            }
                          },
                          "right": {
                            "type": "LogicalExpression",
                            "operator": "&&",
                            "left": {
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
                                    "name": "function"
                                  }
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "named"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "value": false,
                                "raw": "false"
                              }
                            },
                            "right": {
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
                                    "name": "arguments"
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "called"
                                  }
                                },
                                "right": {
                                  "type": "Literal",
                                  "value": null,
                                  "raw": "null"
                                }
                              },
                              "right": {
                                "type": "LogicalExpression",
                                "operator": "||",
                                "left": {
                                  "type": "BinaryExpression",
                                  "operator": "===",
                                  "left": {
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
                                        "name": "called"
                                      }
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "name"
                                    }
                                  },
                                  "right": {
                                    "type": "Literal",
                                    "value": "unknown",
                                    "raw": "'unknown'"
                                  }
                                },
                                "right": {
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
                                            "name": "arguments"
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "called"
                                          }
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "name"
                                        }
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "startsWith"
                                      }
                                    },
                                    "arguments": [
                                      {
                                        "type": "Literal",
                                        "value": "{}",
                                        "raw": "'{}'"
                                      }
                                    ]
                                  },
                                  "right": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  }
                                }
                              }
                            }
                          }
                        },
                        "right": {
                          "type": "LogicalExpression",
                          "operator": "||",
                          "left": {
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
                                  "name": "function"
                                }
                              },
                              "property": {
                                "type": "Identifier",
                                "name": "unknown"
                              }
                            },
                            "right": {
                              "type": "Literal",
                              "value": true,
                              "raw": "true"
                            }
                          },
                          "right": {
                            "type": "LogicalExpression",
                            "operator": "&&",
                            "left": {
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
                                    "name": "function"
                                  }
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "unknown"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "value": false,
                                "raw": "false"
                              }
                            },
                            "right": {
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
                                    "name": "arguments"
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "called"
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
                                "operator": "!==",
                                "left": {
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
                                      "name": "called"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "name"
                                  }
                                },
                                "right": {
                                  "type": "Literal",
                                  "value": "unknown",
                                  "raw": "'unknown'"
                                }
                              }
                            }
                          }
                        }
                      },
                      "right": {
                        "type": "LogicalExpression",
                        "operator": "||",
                        "left": {
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
                                "name": "function"
                              }
                            },
                            "property": {
                              "type": "Identifier",
                              "name": "object"
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": true,
                            "raw": "true"
                          }
                        },
                        "right": {
                          "type": "LogicalExpression",
                          "operator": "&&",
                          "left": {
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
                                  "name": "function"
                                }
                              },
                              "property": {
                                "type": "Identifier",
                                "name": "object"
                              }
                            },
                            "right": {
                              "type": "Literal",
                              "value": false,
                              "raw": "false"
                            }
                          },
                          "right": {
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
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "called"
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
                                        "name": "called"
                                      }
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "name"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "startsWith"
                                  }
                                },
                                "arguments": [
                                  {
                                    "type": "Literal",
                                    "value": "{}",
                                    "raw": "'{}'"
                                  }
                                ]
                              },
                              "right": {
                                "type": "Literal",
                                "value": false,
                                "raw": "false"
                              }
                            }
                          }
                        }
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
                                "value": "function %s() called",
                                "raw": "'function %s() called'"
                              },
                              {
                                "type": "ConditionalExpression",
                                "test": {
                                  "type": "BinaryExpression",
                                  "operator": "!=",
                                  "left": {
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
                                  },
                                  "right": {
                                    "type": "Literal",
                                    "value": null,
                                    "raw": "null"
                                  }
                                },
                                "consequent": {
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
                                      "name": "called"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "name"
                                  }
                                },
                                "alternate": {
                                  "type": "Literal",
                                  "value": "unknown",
                                  "raw": "'unknown'"
                                }
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
              "alternate": null
            };
            node.body.body.unshift(prepend_node);
          }
          break;
      }
    }
    node = node.tree.next;
  }
};

//T: add support log level for function logging
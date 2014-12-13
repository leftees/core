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

platform.kernel._preprocessors.server[2].code_blocking = function(ast,code,file,module,preprocessor){
  //C: keeps incremental count within same level
  var counters = [];
  //C: keeps current function index (level)
  var level = 0;

  counters[level] = 0;

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
        skip = true;
    }
    switch(node.type){
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
      case 'ArrowExpression':
        ++level;
        counters[level] = 0;
        break;
    }
    if (node.tree.scope != null && node === node.tree.scope.tree.end) {
      --level;
    }
    if (skip === false) {
      if (node._is_exec_block === true){
        ++counters[level];
        var prepend_node = null;
        if (counters[level] === 1) {
          // injecting: var __c_ = 0;
          prepend_node = {
            "type": "VariableDeclaration",
              "declarations": [
              {
                "type": "VariableDeclarator",
                "id": {
                  "type": "Identifier",
                  "name": "__c_"
                },
                "init": {
                  "type": "Literal",
                  "value": counters[level],
                  "raw": counters[level].toString()
                }
              }
            ],
            "kind": "var"
          }
        } else {
          // injecting: __c_ = 1;
          prepend_node = {
            "type": "ExpressionStatement",
            "expression": {
            "type": "AssignmentExpression",
              "operator": "=",
              "left": {
              "type": "Identifier",
                "name": "__c_"
            },
            "right": {
              "type": "Literal",
                "value": counters[level],
                "raw": counters[level].toString()
              }
            }
          };
        }
        node.tree.container.splice(node.tree.container.indexOf(node),0,prepend_node);
      }
    }
    node = node.tree.next;
  }
};
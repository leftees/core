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

platform.kernel._preprocessors.server.code_blocking = function(ast,code,file,module,preprocessor){
  //C: keeps incremental count within same level
  var counters = [];
  //C: keeps current function index (level)
  var level = 0;

  counters[level] = 0;

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1){
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
      if (node._is_block === true){
          ++counters[level];
          var prepend_code = '';
          if (counters[level] === 1) {
            prepend_code = 'var ';
          }
          prepend_code += native.util.format('__c_=%s;', counters[level]);
          node.prepend.push(prepend_code);
      }
    }
    node = node.tree.next;
  }
};
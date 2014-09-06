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
  //C: keeps last function/program object
  var scopes = [];
  //C: keeps current function index (level)
  var level = 0;

  counters[level] = 0;
  scopes[level] = ast;

  var node = ast;
  while (node != null) {
    var skip = false;
    if (scopes[level] != null && scopes[level].tags != null && scopes[level].tags['preprocessor.disable'] != null && scopes[level].tags['preprocessor.disable'].indexOf(preprocessor) > -1){
        skip = true;
    }
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      ++level;
      counters[level] = 0;
      scopes[level] = node;
    }
    if (scopes[level] != null && node === scopes[level].tree.end) {
      --level;
    }
    if (skip === false) {
      var proceed = false;
      switch(node.type) {
        case 'BlockStatement':
          if (node.parent != null
            && node.parent.type !== 'FunctionExpression'
            && node.parent.type !== 'FunctionDeclaration'
            && node.parent.type !== 'DoWhileStatement'
            && node.parent.type !== 'ForInStatement'
            && node.parent.type !== 'ForStatement'
            && node.parent.type !== 'IfStatement'
            && node.parent.type !== 'SwitchStatement'
            && node.parent.type !== 'TryStatement'
            && node.parent.type !== 'WhileStatement'
            && node.parent.type !== 'WithStatement'
            && node.parent.type !== 'CatchClause'){
            proceed = true;
          }
          break;
        case 'VariableDeclaration':
          if (node.parent != null
            && node.parent.type !== 'ForInStatement'
            && node.parent.type !== 'ForStatement'){
            proceed = true;
          }
          break;
        case 'BreakStatement':
        case 'ContinueStatement':
        case 'DebuggerStatement':
        case 'DoWhileStatement':
        case 'EmptyStatement':
        case 'ExpressionStatement':
        case 'ForInStatement':
        case 'ForStatement':
        case 'IfStatement':
        case 'LabeledStatement':
        case 'ReturnStatement':
        case 'SwitchStatement':
        case 'ThrowStatement':
        case 'TryStatement':
        case 'WhileStatement':
        case 'WithStatement':
          proceed = true;
          break;
      }
      if (proceed === true){
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
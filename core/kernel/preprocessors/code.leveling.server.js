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

platform.kernel._preprocessors.server.code_leveling = function(ast,code,file,module,preprocessor){
  //C: keeps last function/program object
  var scopes = [];
  //C: keeps current function index (level)
  var level = 0;

  scopes[level] = ast;

  var node = ast;
  while (node != null) {
    var skip = false;
    if (scopes[level] != null && scopes[level].tags != null && scopes[level].tags['preprocessor.disable'] != null && scopes[level].tags['preprocessor.disable'].indexOf(preprocessor) > -1){
      skip = true;
    }
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      ++level;
      scopes[level] = node;
    }
    if (scopes[level] != null && node === scopes[level].tree.end) {
      --level;
    }
    if (skip === false) {
      if (node.tags != null && node.tags['runlevel'] != null && node.tags['runlevel'].length > 0) {
        node.tags['runlevel'].forEach(function(runlevel){
          platform.kernel.runlevels[runlevel] = platform.kernel.runlevels[runlevel] || false;
        });
        if (native.parser.js.utils.ast.isStatement(node) === true
          && (node.type !== 'BlockStatement'
            || (node.type === 'BlockStatement'
              && node.parent != null
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
              && node.parent.type !== 'CatchClause'
              )
            )
          ){
          var prepend_code = 'if(';
          prepend_code += '((platform.kernel.runlevels[\'' + node.tags['runlevel'].join('\'] === true || platform.kernel.runlevels[\'') + '\'] === true)';
          prepend_code += ' && platform.configuration.server.kernel.runleveling === true) || platform.configuration.server.kernel.runleveling === false';
          prepend_code += ')';
          node.prepend.push(prepend_code);
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
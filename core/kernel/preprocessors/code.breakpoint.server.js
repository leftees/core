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

platform.kernel._preprocessors.server.code_breakpoint = function(ast,code,file,module,preprocessor){
  //C: keeps last function/program object
  var scopes = [];
  //C: keeps current function index (level)
  var level = 0;

  scopes[level] = ast;

  var node = ast;
  while (node != null) {
    var skip = false;
    if (scopes[level] != null && scopes[level]._tags != null && scopes[level]._tags['preprocessor.disable'] != null && scopes[level]._tags['preprocessor.disable'].indexOf(preprocessor) > -1){
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
      if (node._tags != null && node._tags['b'] != null) {
        if (node._is_block === true){
          //T: append code to the closest safe node (backward)
          var prepend_code = 'if (platform.runtime.debugging === true) { debugger; }';
          node.prepend.push(prepend_code);
        } else {
          console.warn('breakpoint tag ignored for node at line %s in %s',node.loc.start.line,(file == null) ? 'eval code' : ('file ' + file));
        }
      }
    }
    node = node.tree.next;
  }
};
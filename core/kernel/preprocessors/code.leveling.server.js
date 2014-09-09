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
  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1){
      skip = true;
    }
    if (skip === false) {
      if (node._tags != null && node._tags['runlevel'] != null && node._tags['runlevel'].length > 0) {
        node._tags['runlevel'].forEach(function(runlevel){
          platform.kernel.runlevels[runlevel] = platform.kernel.runlevels[runlevel] || false;
        });
        if (node._is_block === true){
          var prepend_code = 'if(';
          prepend_code += '((platform.kernel.runlevels[\'' + node._tags['runlevel'].join('\'] === true || platform.kernel.runlevels[\'') + '\'] === true)';
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
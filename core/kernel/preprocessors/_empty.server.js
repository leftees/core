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

platform.kernel._preprocessors.server[2].change_me = function(ast,code,file,module,preprocessor){
  var node = ast;
  while (node != null) {
    var skip = false;
    // at scope
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    // at node
    if (node._tags != null && node._tags['preprocessor.disable'] != null && (node._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node._tags['preprocessor.disable'].length === 0 || node._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    // at parent
    if (node.tree.parent != null && node.tree.parent._tags != null && node.tree.parent._tags['preprocessor.disable'] != null && (node.tree.parent._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.parent._tags['preprocessor.disable'].length === 0 || node.tree.parent._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }

    if (skip === false) {

    }
    node = node.tree.next;
  }
};
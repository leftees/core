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

platform.kernel._preprocessors.server.exception_dump = function(ast,code,file,module,preprocessor){
  var prepend_code = 'try {';
  var append_code = '} catch(__exception_) {' + Function.info.code(_exception_dump_code, true) + '}';

  var node = ast;
  while (node != null) {
    var skip = false;
    if (node.tree.scope != null && node.tree.scope._tags != null && node.tree.scope._tags['preprocessor.disable'] != null && (node.tree.scope._tags['preprocessor.disable'].indexOf(preprocessor) > -1 || node.tree.scope._tags['preprocessor.disable'].length === 0 || node.tree.scope._tags['preprocessor.disable'].indexOf('all') > -1)){
      skip = true;
    }
    if (skip === false) {
      switch(node.type){
        //T: avoid code duplication
        case 'Program':
          if (node.body.length > 0) {
            var function_dump = [];
            native.parser.js.traverse(node, {
              'enter': function (child_node, parent) {
                if (child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      function_dump.push('\'' + child_node.id.name + '\': ' + child_node.id.name);
                      break;
                  }
                }
              }
            });
            if (function_dump.length > 0) {
              function_dump = '{' + function_dump.join(', ') + '}';
            } else {
              function_dump = '{}';
            }
            node.body[0].prepend.push(prepend_code);
            node.body[node.body.length - 1].append.push(append_code.replace('$0', function_dump));
          }
          break;
        case 'FunctionExpression':
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
          if (node.body.type === 'BlockStatement' && node.body.body.length > 0){
            var function_dump = [];
            node.params.forEach(function(param){
              function_dump.push('\'' + param.name + '\': ' + param.name);
            });
            native.parser.js.traverse(node,{
              'enter': function(child_node,parent) {
                if (child_node.tree.scope === node) {
                  switch (child_node.type) {
                    case 'VariableDeclarator':
                      function_dump.push('\'' + child_node.id.name + '\': ' + child_node.id.name);
                      break;
                  }
                }
              }
            });
            if (function_dump.length > 0){
              function_dump = '{' + function_dump.join(', ') + '}';
            } else {
              function_dump = '{}';
            }
            node.body.body[0].prepend.push(prepend_code);
            node.body.body[node.body.body.length-1].append.push(append_code.replace('$0',function_dump));
          }
          break;
      }
    }
    node = node.tree.next;
  }
};

//T: push/store exception data somewhere
var _exception_dump_code = function() {
  (function(){
    __exception_.date = new Date();
    __exception_.dump = $0;
    __exception_.called = arguments.called;
    throw __exception_;
  })();
};
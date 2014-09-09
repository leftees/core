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

platform.kernel._preprocessors.server.code_documentation = function(ast,code,file,module,preprocessor){
  if(platform.configuration.server.kernel.documentation.generate === false){
    return;
  }
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
      var target = node;
      var comments = null;
      switch (node.type) {
        case 'AssignmentExpression':
          target = node.left;
          comments = node.parent.leadingComments;
          break;
        case 'FunctionDeclaration':
        case 'VariableDeclarator':
          comments = node.leadingComments;
          break;
      }
      if (comments != null) {
        var documentation_name = null;
        var documentation_object = null;
        if (target._name != null && global.hasOwnProperty(target._name.match(/^\b[^.\[\(]*\b/)) === true){
          documentation_name = target._name;
          documentation_object = {};
        }
        if (documentation_object != null) {
          comments.forEach(function (comment) {
            if ((comment.type === 'Line' || comment.type === 'Block') && comment.value.length > 0 && comment.value.charCodeAt(1) === 0x3A){  // ':'
              var ch = comment.value.charCodeAt(0);
              switch(ch){
                case 0x46:  // 'F'
                  documentation_object.type = 'Function';
                  documentation_object.description = comment.value.slice(2).trim();
                  break;
                case 0x41:  // 'A'
                  documentation_object.arguments = documentation_object.arguments || {};
                  var argument_position = comment.value.slice(2).indexOf(':');
                  if (argument_position > -1) {
                    var argument_name = comment.value.slice(2,argument_position+2).trim();
                    var argument_optional = false;
                    if (argument_name[0] === '[' && argument_name[argument_name.length-1] === ']') {
                      argument_name = argument_name.slice(1,argument_name.length-1);
                      argument_optional = true;
                    }
                    var argument_description = comment.value.slice(argument_position+2+1).trim();
                    documentation_object.arguments[argument_name] = {
                      'description': argument_description,
                      'optional': argument_optional
                    };
                  }
                  break;
                case 0x52:  // 'R'
                  documentation_object.result = comment.value.slice(2).trim();
                  break;
                case 0x4F:  // 'O'
                  documentation_object.type = 'Object';
                  documentation_object.description = comment.value.slice(2).trim();
                  break;
                case 0x56:  // 'V'
                  documentation_object.type = 'Variable';
                  documentation_object.description = comment.value.slice(2).trim();
                  break;
                case 0x4E:  // 'N'
                  documentation_object.type = 'Namespace';
                  documentation_object.description = comment.value.slice(2).trim();
                  break;
                case 0x48:  // 'H'
                  documentation_object.help = documentation_object.help || [];
                  documentation_object.help.push(comment.value.slice(2).trim());
                  break;
              }
            }
          });
          platform.development.jsdoc[documentation_name] = documentation_object;
        }
      }
    }
    node = node.tree.next;
  }
};

platform.development = platform.development || {};
platform.development.jsdoc = platform.development.jsdoc || {};
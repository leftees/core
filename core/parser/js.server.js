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

platform.parser = platform.parser || {};

platform.parser.js = {};

platform.parser.js._tree_ref_enter = function(node,parent,previous){
  node._tree = node._tree || {};
  if (previous != null) {
    previous._tree.next = node;
  }
  node._tree.previous = previous;
  node._tree.start = node;
};

platform.parser.js._tree_ref_leave = function(node,parent,previous){
  if (previous === node) {
    node._tree.end = node;
  } else {
    node._tree.end = previous;
  }
};

platform.parser.js._code_ref_enter = function(node,parent,previous,previous_to_patch){
  node._code = node._code || {};
  var next_previous_to_patch = undefined;
  switch (node.type) {
    case 'ArrayExpression':
      node._code.start = node;
      node._code.end = node.elements[node.elements.length-1]||node;
      break;
    case 'AssignmentExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':
      node._code.start = node;
      node._code.end = node;
      node._code.previous = node.left;
      node._code.next = node.right;
      node.left._code = node.left._code || {};
      node.left._code.next = node;
      node.left._code.previous = previous;
      node.right._code = node.right._code || {};
      node.right._code.previous = node;
      break;
    case 'UpdateExpression':
      node._code.start = node;
      node._code.end = node;
      node._code.previous = node.argument;
      node.argument._code = node.argument._code || {};
      node.argument._code.previous = previous;
      node.argument._code.next = node;
      previous._code.next = node.argument;
      next_previous_to_patch = node;
      break;
    case 'UnaryExpression':
    case 'ArrowFunctionExpression':
    case 'BlockStatement':
    case 'BreakStatement':
    case 'CallExpression':
    case 'CatchClause':
    case 'ConditionalExpression':
    case 'ContinueStatement':
    case 'DoWhileStatement':
    case 'DebuggerStatement':
    case 'EmptyStatement':
    case 'ExpressionStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'Identifier':
    case 'IfStatement':
    case 'Literal':
    case 'LabeledStatement':
    case 'MemberExpression':
    case 'NewExpression':
    case 'ObjectExpression':
    case 'Program':
    case 'Property':
    case 'ReturnStatement':
    case 'SequenceExpression':
    case 'SwitchStatement':
    case 'SwitchCase':
    case 'ThisExpression':
    case 'ThrowStatement':
    case 'TryStatement':
    case 'VariableDeclaration':
    case 'VariableDeclarator':
    case 'WhileStatement':
    case 'WithStatement':
      break;
  }
  node._code.start = node._code.start || node;
  node._code.previous = node._code.previous || previous;
  if (previous_to_patch != null && node._code.next == null) {
    previous_to_patch._code.next = previous_to_patch._code.next || node;
    previous_to_patch = undefined;
  } else if (node._code.previous != null) {
    node._code.previous._code.next = node._code.previous._code.next || node;
  }
  return next_previous_to_patch || previous_to_patch;
};

platform.parser.js._code_ref_leave = function(node,parent,previous){
  if (node._code.end == null){
    if (previous === node) {
      node._code.end = node;
    } else {
      node._code.end = previous;
    }
  }
};

platform.parser.js.parse = function(code){
  var ast = native.parser.js.parse(code,{ 'attachComment': true, 'range': true, 'comment': true, 'loc': true, 'tag': true });
  delete ast.comments;
  delete ast.range;

  var breadcrumb = [];
  var count_id = 0;
  var previous_node = null;
  var previous_to_patch = null;

  native.parser.js.traverse(ast,{
    'enter': function(node,parent){
      node._id = ++count_id;
      if (previous_node != null){
        if (platform.configuration.server.debugging.parser.js === true) {
          console.debug('%s |%s found node #%s type %s',breadcrumb.length,' '.repeat(breadcrumb.length),node._id,node.type);
        }
      }
      breadcrumb.push(node);
      node._parent = parent;
      platform.parser.js._tree_ref_enter(node,parent,previous_node);
      previous_to_patch = platform.parser.js._code_ref_enter(node,parent,previous_node,previous_to_patch);
      previous_node = node;
      delete node.trailingComments;
      if (node.leadingComments != null){
        node.leadingComments.forEach(function(comment){
          if (comment.type === 'Tag') {
            if (node.tags == null) {
              node.tags = {};
            }
            var name = null;
            var data = null;
            var params_position = comment.value.indexOf('(');
            if (params_position === -1) {
              name = comment.value;
              node.tags[name] = {
                'name': name
              };
            } else {
              name = comment.value.slice(0, params_position);
              data = comment.value.slice(params_position + 1, comment.value.lastIndexOf(')'));
              node.tags[name] = {
                'name': name,
                'data': data
              };
            }
          }
        });
      }
    },
    'leave': function(node,parent){
      breadcrumb.pop();
      platform.parser.js._tree_ref_leave(node,parent,previous_node);
      platform.parser.js._code_ref_leave(node,parent,previous_node);
      if (platform.configuration.server.debugging.parser.js === true) {
        console.debug('%s |%s found node #%s type %s',breadcrumb.length,' '.repeat(breadcrumb.length),node._id,node.type);
      }
    }
  });

  if (platform.configuration.server.debugging.parser.js === true) {
    native.parser.js.traverse(ast, {
      'enter': function (node, parent) {
        var tags_label = '0 tags';
        var comments_label = '0 comments';
        if (node.tags != null){
          tags_label = Object.keys(node.tags).length + ' tags: ' + Object.keys(node.tags).join(', ');
        }
        if (node.comments != null){
          comments_label = Object.keys(node.comments).length + ' comments';
        }
        console.debug('node #%s type %s:\n\ttree: start #%s, end #%s, previous #%s, next #%s\n\tcode: start #%s , end #%s, previous #%s, next #%s\n\t%s\n\t%s',node._id,node.type,((node._tree.start!=null)?node._tree.start._id:'n/a'),((node._tree.end!=null)?node._tree.end._id:'n/a'),((node._tree.previous!=null)?node._tree.previous._id:'n/a'),((node._tree.next!=null)?node._tree.next._id:'n/a'),((node._code.start!=null)?node._code.start._id:'n/a'),((node._code.end!=null)?node._code.end._id:'n/a'),((node._code.previous!=null)?node._code.previous._id:'n/a'),((node._code.next!=null)?node._code.next._id:'n/a'),comments_label,tags_label);
      }
    });
  }

  return ast;
};

platform.parser.js.stringify = function(ast){
  return native.parser.js.codegen(ast,{
    format: {
      indent: {
        style: (platform.runtime.development) ? '  ' : '',
        base: 0,
        adjustMultilineComment: false
      },
      newline: '\n',
      space: ' ',
      json: false,
      renumber: !platform.runtime.development,
      hexadecimal: !platform.runtime.development,
      quotes: 'single',
      escapeless: !platform.runtime.development,
      compact: !platform.runtime.development,
      parentheses: platform.runtime.development,
      semicolons: platform.runtime.development,
      safeConcatenation: true
    },
    moz: {
      starlessGenerator: false,
      parenthesizedComprehensionBlock: false,
      comprehensionExpressionStartsWithAssignment: false
    },
    parse: null,
    comment: platform.runtime.development,
    tag: true,
    //sourceMap: undefined,
    //sourceMapRoot: null,
    //sourceMapWithCode: false,
    //sourceContent: undefined,
    directive: false,
    verbatim: undefined
  });
};
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

platform.parser.js._tree_ast_ref_enter = function(node,parent,previous){
  node.tree = node.tree || {};
  if (previous != null) {
    previous.tree.next = node;
  }
  node.tree.previous = previous;
  node.tree.start = node;
};

platform.parser.js._tree_ast_ref_leave = function(node,parent,previous){
  if (previous === node) {
    node.tree.end = node;
  } else {
    node.tree.end = previous;
  }
};

platform.parser.js._block_check = function(node,parent,previous){
  switch(node.type) {
    case 'BlockStatement':
      if (parent != null
        && parent.type !== 'FunctionExpression'
        && parent.type !== 'FunctionDeclaration'
        && parent.type !== 'DoWhileStatement'
        && parent.type !== 'ForInStatement'
        && parent.type !== 'ForStatement'
        && parent.type !== 'IfStatement'
        && parent.type !== 'SwitchStatement'
        && parent.type !== 'TryStatement'
        && parent.type !== 'WhileStatement'
        && parent.type !== 'WithStatement'
        && parent.type !== 'CatchClause'){
        node._is_block = true;
      }
      break;
    case 'VariableDeclaration':
      if (parent != null
        && parent.type !== 'ForInStatement'
        && parent.type !== 'ForStatement'){
        node._is_block = true;
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
      node._is_block = true;
      break;
  }
};

platform.parser.js._name_get = function(node,parent,previous) {
  switch(node.type) {
    case 'AssignmentExpression':
      if (node.left.type === 'Identifier'){
        node.left._name = node.left.name;
      } else if (node.left.type === 'MemberExpression') {
        var skip = false;
        native.parser.js.traverse(node.left,{
          'enter': function(node,parent) {
            switch(node.type){
              case 'MemberExpression':
              case 'UnaryExpression':
              case 'UpdateExpression':
              case 'Literal':
              case 'Identifier':
                break;
              default:
                skip = true;
                break;
            }
          }
        });
        if (skip === false) {
          node.left._name = native.parser.js.codegen(node.left);
        }
      }
      node.right._name = node.left._name;
      break;
    case 'FunctionDeclaration':
      node._name = node.id.name;
      break;
    case 'VariableDeclarator':
      node._name = node.id.name;
      if (node.init != null) {
        node.init._name = node._name;
      }
      break;
    case 'Property':
      var property_name = node.key.name || node.key.value;
      if (parent != null && parent._name != null){
        node.value._name = parent._name + '.' + property_name;
      } else {
        node.value._name = '{}.' + property_name;
      }
      node._name = node.value._name;
      break;
  }
};

platform.parser.js.parse = function(code){
  var ast = native.parser.js.parse(code,{ 'attachComment': true, 'range': true, 'comment': true, 'loc': true, 'tag': true });
  delete ast.comments;
  delete ast.range;

  var breadcrumb = [];
  var count_id = 0;
  var previous = null;

  native.parser.js.traverse(ast, {
    'enter': function (node, parent) {
      switch (node.type) {
        case 'IfStatement':
          if (node.consequent != null && node.consequent.type !== 'BlockStatement') {
            node.consequent = {
              type: 'BlockStatement',
              body: [node.consequent]
            };
          }
          if (node.alternate != null && node.alternate.type !== 'BlockStatement') {
            node.alternate = {
              type: 'BlockStatement',
              body: [node.alternate]
            };
          }
          break;
        case 'LabeledStatement':
        case 'WithStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ForStatement':
        case 'ForInStatement':
          if (node.body != null && node.body.type !== 'BlockStatement') {
            node.body = {
              type: 'BlockStatement',
              body: node.body
            };
          }
          break;
      }
    }
  });

  native.parser.js.traverse(ast,{
    'enter': function(node,parent){
      node._id = ++count_id;

      platform.parser.js._block_check(node,parent,previous);
      platform.parser.js._name_get(node,parent,previous);

      if (previous != null){
        if (platform.configuration.server.debugging.parser.js === true) {
          console.debug('%s |%s found node #%s type %s',breadcrumb.length,' '.repeat(breadcrumb.length),node._id,node.type);
        }
      }
      breadcrumb.push(node);
      node.parent = parent;
      node.prepend = [];
      node.append = [];
      platform.parser.js._tree_ast_ref_enter(node,parent,previous);
      previous = node;
      delete node.trailingComments;
      if (node.leadingComments != null){
        node.leadingComments.forEach(function(comment){
          if (comment.type === 'Tag') {
            if (node._tags == null) {
              node._tags = {};
            }
            var name = null;
            var data = null;
            var params_position = comment.value.indexOf('(');
            if (params_position === -1) {
              name = comment.value;
            } else {
              name = comment.value.slice(0, params_position);
              data = comment.value.slice(params_position + 1, comment.value.lastIndexOf(')'));
            }
            node._tags[name] = node._tags[name] || [];
            if (data != null){
              node._tags[name].push(data);
            }
          }
        });
      }
    },
    'leave': function(node,parent){
      breadcrumb.pop();
      platform.parser.js._tree_ast_ref_leave(node,parent,previous);
      if (platform.configuration.server.debugging.parser.js === true) {
        console.debug('%s |%s found node #%s type %s',breadcrumb.length,' '.repeat(breadcrumb.length),node._id,node.type);
      }
    }
  });

  if (platform.configuration.server.debugging.parser.js === true) {
    native.parser.js.traverse(ast, {
      'enter': function (node, parent) {
        var _tags_label = '0 _tags';
        var comments_label = '0 comments';
        if (node._tags != null){
          _tags_label = Object.keys(node._tags).length + ' _tags: ' + Object.keys(node._tags).join(', ');
        }
        if (node.comments != null){
          comments_label = Object.keys(node.comments).length + ' comments';
        }
        console.debug('node #%s type %s:\n\ttree: start #%s, end #%s, previous #%s, next #%s\n\t%s\n\t%s',node._id,node.type,((node.tree.start!=null)?node.tree.start._id:'n/a'),((node.tree.end!=null)?node.tree.end._id:'n/a'),((node.tree.previous!=null)?node.tree.previous._id:'n/a'),((node.tree.next!=null)?node.tree.next._id:'n/a'),comments_label,_tags_label);
      }
    });
  }

  return ast;
};

platform.parser.js.stringify = function(ast,tag){
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
    parse: null,
    comment: platform.runtime.development,
    tag: tag || false,
    //sourceMap: undefined,
    //sourceMapRoot: null,
    //sourceMapWithCode: false,
    //sourceContent: undefined,
    directive: false,
    verbatim: undefined
  });
};
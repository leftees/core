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
//TODO: HANDLE ECMASCRIPT 6/7 NODE OBJECTS
/*
 LIST UPDATED ON: 2015/02/17
 COMMIT: 208b9677ee83f279832af814d7b1d2d7d1ee2079
 TESTS: tests.js, tests-6to5.js, tests-playground.js, tests-harmony.js

 ECMAScript 7

 ObjectPattern
 SpreadProperty
 +AwaitExpression
 +FunctionDeclaration.async
 +FunctionExpression.async
 +ArrowFunctionExpression.async
 ExportDeclaration
 VirtualPropertyExpression
 PrivateDeclaration
 ClassDeclaration
 ClassBody

 Playground

 MethodDefinition
 BindMemberExpression
 BindFunctionExpression

 ECMAScript 6

 TaggedTemplateExpression
 TemplateLiteral
 TemplateElement
 ArrayPattern
 AssignmentPattern
 SequenceExpression
 ComprehensionExpression
 ComprehensionBlock
 ArrayExpression
 ObjectPattern
 ExportDeclaration
 ClassDeclaration
 ClassBody
 ClassExpression
 ExportBatchSpecifier
 ExportSpecifier
 ImportDeclaration
 ImportSpecifier
 ImportBatchSpecifier
 YieldExpression
 +ForOfStatement
 MethodDefinition
 RestElement
 +ParenthesizedExpression

 */

platform.parser = platform.parser || {};

platform.parser.js = {};

platform.parser.js._tree_ast_ref_enter = function(node,parent,previous){
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
        && parent.type !== 'ArrowFunctionExpression'
        && parent.type !== 'ArrowExpression'
        && parent.type !== 'FunctionDeclaration'
        && parent.type !== 'DoWhileStatement'
        && parent.type !== 'ForInStatement'
        && parent.type !== 'ForOfStatement'
        && parent.type !== 'ForStatement'
        && parent.type !== 'IfStatement'
        && parent.type !== 'SwitchStatement'
        && parent.type !== 'SwitchCase'
        && parent.type !== 'TryStatement'
        && parent.type !== 'WhileStatement'
        && parent.type !== 'WithStatement'
        && parent.type !== 'CatchClause'){
        return true;
      }
      break;
    case 'VariableDeclaration':
      if (parent != null
        && parent.type !== 'ForInStatement'
        && parent.type !== 'ForOfStatement'
        && parent.type !== 'ForStatement'){
        return true;
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
      return true;
  }
  return false;
};

platform.parser.js._container_get = function(node,parent){
  if (parent != null){
    if (parent.type === 'Program' || parent.type === 'BlockStatement'){
      return parent.body;
    } else {
      throw new Error('parser has detected unsupported container for exec block');
    }
  }
  return null;
};

platform.parser.js._name_get = function(node,parent,previous) {
  switch(node.type) {
    case 'AssignmentExpression':
      if (node.left.type === 'Identifier'){
        node.left._name = node.left.name;
      } else if (node.left.type === 'MemberExpression') {
        var skip = false;
        native.parser.js.traverse(node.left,{
          'enter': function(child_node,parent) {
            switch(child_node.type){
              case 'MemberExpression':
                if (child_node.computed === true) {
                  //if (child_node.property.type !== 'Literal') {
                    skip = true;
                  //}
                }
                break;
              //case 'UnaryExpression':
              //case 'UpdateExpression':
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
      } /*else {
        node.value._name = '{}.' + property_name;
      }*/
      node._name = node.value._name;
      break;
  }
};

platform.parser.js.parse = function(code,filename) {
  var comments = [];
  var tokens = [];
  var ast = native.parser.js.parse(code,{
    'allowImportExportEverywhere': false,
    'allowReturnOutsideFunction': true,
    'ecmaVersion': 7,
    'playground': false,
    'strictMode': false,
    'onComment': comments,
    'locations': true,
    'onToken': tokens,
    'ranges': true,
    'preserveParens': false,
    'sourceFile': filename||'unknown'
  });

  ast._sourceFilename = filename;

  var ast = native.parser.js.merge(ast,comments,tokens);

  return platform.parser.js.normalizeAST(ast);
};

platform.parser.js.normalizeAST = function(ast){
  delete ast.comments;
  delete ast.range;

  var breadcrumb = [];
  var count_id = 0;
  var previous = null;
  var block = null;

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
        case "SwitchCase":
          if (node.consequent != null && (node.consequent.constructor === Array && (node.consequent.length > 1 || (node.consequent.length === 1 && node.consequent[0].type !== 'BlockStatement')))) {
            node.consequent = [{
              type: 'BlockStatement',
              body: node.consequent
            }];
          }
          break;
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
        case 'FunctionDeclaration':
        case 'WithStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
          if (node.body != null && node.body.type !== 'BlockStatement') {
            node.body = {
              type: 'BlockStatement',
              body: [node.body]
            };
          }
          break;
      }
    }
  });

  // keeps last function/program object
  var scopes = [];
  var variables = [];

  // keeps current function index (level)
  var level = 0;

  scopes[level] = ast;
  variables[level] = [];
  ast._vars = variables[level];
  ast._prepend = [];
  ast._append = [];

  native.parser.js.traverse(ast,{
    'enter': function(node,parent){

      if (previous != null){
        if (platform.configuration.debug.parser.js === true) {
          console.debug('%s |%s found node #%s type %s',breadcrumb.length,' '.repeat(breadcrumb.length),node._id,node.type);
        }
      }
      breadcrumb.push(node);

      node._id = ++count_id;
      node.tree = node.tree || {};
      node.tree.parent = parent;

      node.tree.scope = scopes[level];
      switch(node.type){
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'ArrowExpression':
          ++level;
          scopes[level] = node;
          variables[level] = [];
          node._vars = variables[level];
          node._args = [];
          node._level = level;
          if (node.params != null) {
            node.params.forEach(function (param) {
              node._args.push(param.name);
            });
          }
          break;
        case 'VariableDeclarator':
          if (node.id != null && node.id.name != null) {
            variables[level].push(node.id.name);
          }
          break;
      }

      if (platform.parser.js._block_check(node,parent,previous) === true){
        node._is_exec_block = true;
        node.tree.container = platform.parser.js._container_get(node,parent);
        block = node;
      }
      node.tree.block = block;

      platform.parser.js._name_get(node,parent,previous);

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
              data = JSON.parseAndNormalize(comment.value.slice(params_position + 1, comment.value.lastIndexOf(')')));
            }
            node._tags[name] = node._tags[name] || [];
            if (data != null){
              node._tags[name].push(data);
            }
          }
        });
      }
      if (node._tags != null) {
        switch (node.type){
          case 'ExpressionStatement':
            node.expression._tags = node._tags;
            break;
          case 'AssignmentExpression':
            node.left._tags = node._tags;
            node.right._tags = node._tags;
            break;
        }
      }
    },
    'leave': function(node,parent){
      breadcrumb.pop();

      platform.parser.js._tree_ast_ref_leave(node,parent,previous);

      if (scopes[level] != null && node === scopes[level]) {
        delete scopes[level];
        --level;
      }

      if (platform.configuration.debug.parser.js === true) {
        console.debug('%s |%s found node #%s type %s',breadcrumb.length,' '.repeat(breadcrumb.length),node._id,node.type);
      }
    }
  });

  if (platform.configuration.debug.parser.js === true) {
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

platform.parser.js.stringify = function(ast,sourcemap,inlineSourceMap,filename){
  if (ast._prepend.length > 0) {
    var ast_prepend = native.parser.js.parse(ast._prepend.join(';'),{
      'allowImportExportEverywhere': false,
      'allowReturnOutsideFunction': true,
      'ecmaVersion': 7,
      'playground': false,
      'strictMode': false,
      'onComment': null,
      'locations': false,
      'onToken': null,
      'ranges': false,
      'preserveParens': false
    });
    ast.body = ast_prepend.body.concat(ast.body);
  }
  if (ast._append.length > 0) {
    var ast_append = native.parser.js.parse(ast._append.join(';'),{
      'allowImportExportEverywhere': false,
      'allowReturnOutsideFunction': true,
      'ecmaVersion': 7,
      'playground': false,
      'strictMode': false,
      'onComment': null,
      'locations': false,
      'onToken': null,
      'ranges': false,
      'preserveParens': false
    });
    ast.body = ast.body.concat(ast_append.body);
  }
  var generated = native.parser.js.esnext.transform.fromAst(ast,null,{
    'stage': 1,
    'compact': false,
    'sourceMaps': (sourcemap != null) ? sourcemap : false,
    'sourceFileName': filename||ast._sourceFilename,
    'code': true,
    'ast': true,
    'optional': native.compile.optional
  });
  return generated;
};
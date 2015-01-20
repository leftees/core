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

platform.kernel._preprocessors.server[1].javascript_async_scope = function(ast,code,file,module,preprocessor){
  var node = ast;
  while (node != null) {
    if (node._tags != null && node._tags['await'] != null) {
      node.tree.scope._await = true;
    }

    node = node.tree.next;
  }
};

platform.kernel._preprocessors.server[1].javascript_async_unvar = function(ast,code,file,module,preprocessor){
  var variable_declarations_to_fix = [];
  var node = ast;
  while (node != null) {
    if (node.tree.scope._await === true && node.type === 'VariableDeclaration'){
      variable_declarations_to_fix.push(node);
    }

    node = node.tree.next;
  }

  variable_declarations_to_fix.forEach(function(declaration_node){
    //T: fix meta data tree etc...
    switch(declaration_node.tree.parent.type) {
      case 'ForStatement':
        if(declaration_node.declarations.length > 1) {
          declaration_node.type = 'SequenceExpression';
          declaration_node.expressions = [];
          declaration_node.declarations.forEach(function(declarator){
            declaration_node.expressions.push({
              'type': 'AssignmentExpression',
              'operator': '=',
              'left': declarator.id,
              'right': declarator.init || {
                "type": "Identifier",
                "name": "undefined"
              }
            });
          });
        } else {
          declaration_node.type = 'AssignmentExpression';
          declaration_node.operator = '=';
          declaration_node.left = declaration_node.declarations[0].id;
          declaration_node.right = declaration_node.declarations[0].init || {
            "type": "Identifier",
            "name": "undefined"
          };
        }
        delete declaration_node.declarations;
        delete declaration_node.kind;
        break;
      case 'ForInStatement':
        declaration_node.tree.parent.left = declaration_node.declarations[0].id;
        break;
      default:
        if(declaration_node.declarations.length > 1){
          declaration_node.type = 'BlockStatement';
          declaration_node.body = [];
          declaration_node.declarations.forEach(function(declarator){
            declaration_node.body.push({
              'type': 'ExpressionStatement',
              'expression': {
                'type': 'AssignmentExpression',
                'operator': '=',
                'left': declarator.id,
                'right': declarator.init || {
                  "type": "Identifier",
                  "name": "undefined"
                }
              }
            });
          });
        } else {
          declaration_node.type = 'ExpressionStatement';
          declaration_node.expression = {
            'type': 'AssignmentExpression',
            'operator': '=',
            'left': declaration_node.declarations[0].id,
            'right': declaration_node.declarations[0].init || {
              "type": "Identifier",
              "name": "undefined"
            }
          };
        }
        delete declaration_node.declarations;
        delete declaration_node.kind;
        break;
    }
  });
};

platform.kernel._preprocessors.server[1].javascript_async_patch = function(ast,code,file,module,preprocessor){
  var await_nodes_to_fix = [];
  var await_containers_to_fix = [];

  var node = ast;
  while (node != null) {
    if (node._tags != null && node._tags['await'] != null) {
      await_nodes_to_fix.push(node);
    }

    node = node.tree.next;
  }

  await_nodes_to_fix.forEach(function(await_node){
    var await_statement = await_node.tree.block;
    var await_scope_name = await_statement.tree.scope._name;
    if (await_scope_name == null || (await_scope_name != null && await_scope_name.startsWith('{}') === true)) {
      if(platform.configuration.server.debugging.preprocess === true) {
        console.warn('unsupported await usage at line %s in file %s: await supported only in strong named functions',await_statement.loc.start.line,file);
      }
      return;
    }

    var await_container = await_statement.tree.scope;

    var await_container_parent = await_container.tree.block.tree.parent;
    if (await_container_parent.type !== 'BlockStatement' && await_container_parent.type !== 'Program') {
      if(platform.configuration.server.debugging.preprocess === true) {
        console.warn('unsupported await usage at line %s in file %s: container is not a block statement or program',await_node.loc.start.line,file);
      }
      return;
    }

    switch(await_statement.type){
      case 'ExpressionStatement':
        var await_node_parent = await_statement.tree.parent;
        if (await_node_parent.type === 'BlockStatement') {
          if (await_statement.type === 'ExpressionStatement') {
            switch(await_statement.expression.type){
              case 'AssignmentExpression':
                if (await_statement.expression.right.type === 'CallExpression') {
                  await_container._awaits = await_container._awaits || [];
                  await_container._awaits.push(await_node);
                  var await_function_to_fix_found = false;
                  for(var await_function_index = 0; await_function_index < await_containers_to_fix.length; await_function_index++){
                    if (await_containers_to_fix[await_function_index] === await_container){
                      await_function_to_fix_found = true;
                    }
                    break;
                  }
                  if (await_function_to_fix_found === false){
                    await_containers_to_fix.push(await_container);
                  }
                } else {
                  if(platform.configuration.server.debugging.preprocess === true) {
                    console.warn('unsupported await usage at line %s in file %s: await for other than call expression',await_node.loc.start.line,file);
                  }
                  return;
                }
                break;
              case 'CallExpression':
                await_container._awaits = await_container._awaits || [];
                await_container._awaits.push(await_node);
                var await_function_to_fix_found = false;
                for(var await_function_index = 0; await_function_index < await_containers_to_fix.length; await_function_index++){
                  if (await_containers_to_fix[await_function_index] === await_container){
                    await_function_to_fix_found = true;
                  }
                  break;
                }
                if (await_function_to_fix_found === false){
                  await_containers_to_fix.push(await_container);
                }
                break;
              default:
                if(platform.configuration.server.debugging.preprocess === true) {
                  console.warn('unsupported await usage at line %s in file %s: node not in supported expressions',await_node.loc.start.line,file);
                }
                return;
                break;
            }
          } else {
            if(platform.configuration.server.debugging.preprocess === true) {
              console.warn('unsupported await usage at line %s in file %s: node not in expression statement',await_node.loc.start.line,file);
            }
            return;
          }
        } else {
          if(platform.configuration.server.debugging.preprocess === true) {
            console.warn('unsupported await usage at line %s in file %s: parent is not a block statement',await_node.loc.start.line,file);
          }
          return;
        }
        break;
      default:
        console.log(platform.parser.js.stringify(await_statement));
        if(platform.configuration.server.debugging.preprocess === true) {
          console.warn('unsupported await usage at line %s in file %s: unimplemented case',await_node.loc.start.line,file);
        }
        return;
        break;
    }
  });

  await_containers_to_fix.forEach(function(await_container){
    var await_container_parent = await_container.tree.block.tree.parent;
    var await_container_position;
    for (var sibling_index = 0; sibling_index < await_container_parent.body.length; sibling_index++) {
      if (await_container_parent.body[sibling_index] === await_container.tree.block) {
        await_container_position = sibling_index;
        break;
      }
    }

    var function_object_name = await_container._name;
    var arguments_object_name = '__args_' + await_container._level + '_';
    var variables_object_name = '__vars_' + await_container._level + '_';
    var result_object_name = '__result_' + await_container._level + '_';

    var awaits_previous_position = -1;
    var awaits_result;

    var arguments_pack_def = [];
    await_container._args.forEach(function(argument){
      arguments_pack_def.push('\'' + argument + '\': ' + argument);
    });
    var arguments_pack_code = arguments_object_name + ' = {' + arguments_pack_def.join(', ') + '};';

    var variables_pack_def = [];
    await_container._vars.forEach(function(variable){
      variables_pack_def.push('\'' + variable + '\': ' + variable);
    });
    var variables_pack_code = variables_object_name + ' = {' + variables_pack_def.join(', ') + '};';

    var arguments_unpack_def = [];
    await_container._args.forEach(function(argument){
      arguments_unpack_def.push(argument + ' = ' + arguments_object_name + '.' + argument);
    });
    var arguments_unpack_code = ';';
    if (arguments_unpack_def.length > 0) {
      arguments_unpack_code = 'var ' + arguments_unpack_def.join(', ') + ';';
    }

    var variables_unpack_def = [];
    await_container._vars.forEach(function(variable){
      variables_unpack_def.push(variable + ' = ' + variables_object_name + '.' + variable);
    });
    var variables_unpack_code = ';';
    if (variables_unpack_def.length > 0) {
      variables_unpack_code = 'var ' + variables_unpack_def.join(', ') + ';';
    }

    var variables_inject_code = 'var ' + arguments_object_name + ', ' + variables_object_name + ';';

    var variables_init_code = ';';
    if (await_container._vars.length > 0) {
      variables_init_code = 'var ' + await_container._vars.join(', ') + ';';
    }

    var awaits_index = 0;
    var awaits_length = await_container._awaits.length;
    var awaits_bodies = [awaits_length+2];

    awaits_bodies[0] = [];

    native.parser.js.parse(variables_inject_code).body.forEach(function(statement){
      awaits_bodies[0].push(statement);
    });
    native.parser.js.parse(variables_init_code).body.forEach(function(statement){
      awaits_bodies[0].push(statement);
    });
    native.parser.js.parse(arguments_pack_code).body.forEach(function(statement){
      awaits_bodies[0].push(statement);
    });
    native.parser.js.parse(variables_pack_code).body.forEach(function(statement){
      awaits_bodies[0].push(statement);
    });
    native.parser.js.parse(function_object_name + '[' + awaits_index + '].bind(this,' + arguments_object_name + ',' + variables_object_name + ')();').body.forEach(function(statement){
      awaits_bodies[0].push(statement);
    });

    ++awaits_index;

    await_container._awaits.forEach(function(await_node){
      var await_statement = await_node.tree.block;
      var await_node_parent = await_statement.tree.parent;
      var await_node_position;
      for (var sibling_index = 0; sibling_index < await_node_parent.body.length; sibling_index++) {
        if (await_node_parent.body[sibling_index] === await_statement) {
          await_node_position = sibling_index;
          break;
        }
      }

      //T: fix meta data tree etc...
      //T: analyze await statement to proper support loops/tests/cases...

      awaits_bodies[awaits_index] = [];

      native.parser.js.parse(arguments_unpack_code).body.forEach(function(statement){
        awaits_bodies[awaits_index].push(statement);
      });
      native.parser.js.parse(variables_unpack_code).body.forEach(function(statement){
        awaits_bodies[awaits_index].push(statement);
      });

      if (awaits_result != null) {
        awaits_bodies[awaits_index].push(awaits_result);
        awaits_result = null;
      }

      for (var sibling_index = ++awaits_previous_position; sibling_index < await_node_position; sibling_index++) {
        awaits_bodies[awaits_index].push(await_node_parent.body[sibling_index]);
      }

      native.parser.js.parse(arguments_pack_code).body.forEach(function(statement){
        awaits_bodies[awaits_index].push(statement);
      });
      native.parser.js.parse(variables_pack_code).body.forEach(function(statement){
        awaits_bodies[awaits_index].push(statement);
      });

      switch(await_statement.expression.type){
        case 'AssignmentExpression':
          var left_for_result = await_statement.expression.left;
          var right_to_call = await_statement.expression.right;
          awaits_result = {
            'type': 'ExpressionStatement',
            'expression': {
              'type': 'AssignmentExpression',
              'operator': '=',
              'left': left_for_result,
              'right': {
                'type': 'Identifier',
                'name': result_object_name
              }
            }
          };
          right_to_call.arguments.push(native.parser.js.parse('platform.kernel.async.forward.bind(this,' + function_object_name + '[' + awaits_index + '].bind(this,' + arguments_object_name + ',' + variables_object_name + '));').body[0].expression);
          awaits_bodies[awaits_index].push({
            'type': 'ExpressionStatement',
            'expression': right_to_call
          });
          break;
        case 'CallExpression':
          var right_to_call = await_statement;
          right_to_call.expression.arguments.push(native.parser.js.parse('platform.kernel.async.forward.bind(this,' + function_object_name + '[' + awaits_index + '].bind(this,' + arguments_object_name + ',' + variables_object_name + '));').body[0].expression);
          awaits_bodies[awaits_index].push(right_to_call);
          break;
      }

      awaits_previous_position = await_node_position;
      ++awaits_index;
    });

    awaits_bodies[awaits_index] = [];

    native.parser.js.parse(arguments_unpack_code).body.forEach(function(statement){
      awaits_bodies[awaits_index].push(statement);
    });
    native.parser.js.parse(variables_unpack_code).body.forEach(function(statement){
      awaits_bodies[awaits_index].push(statement);
    });

    if (awaits_result != null) {
      awaits_bodies[awaits_index].push(awaits_result);
      awaits_result = null;
    }

    var await_last_node_parent = await_container._awaits[await_container._awaits.length-1].tree.block.tree.parent;
    for (var sibling_index = ++awaits_previous_position; sibling_index < await_last_node_parent.body.length; sibling_index++) {
      awaits_bodies[awaits_index].push(await_last_node_parent.body[sibling_index]);
    }

    if (await_container.tree.block.type === 'ExpressionStatement') {
      switch (await_container.tree.block.expression.type) {
        case 'AssignmentExpression':
          if (await_container.tree.block.expression.right.type === 'FunctionExpression'){
            var await_container_block;
            if (await_container.tree.block.expression.right.body.type === 'BlockStatement'){
              await_container_block = await_container.tree.block.expression.right.body;
            } else {
              await_container_block = await_container.tree.block.expression.right;
            }
            await_container_block.body = awaits_bodies[0];
            for (var body_index = 1; body_index < awaits_bodies.length; body_index++) {
              var await_body_node = native.parser.js.parse(function_object_name + '[' + (body_index-1) + '] = function(' + arguments_object_name + ',' + variables_object_name + ',' + result_object_name +'){};').body[0];
              var await_body_block = await_body_node;
              if (await_body_block.expression.right.body.type === 'BlockStatement') {
                await_body_block = await_body_block.expression.right.body;
              } else {
                await_body_block = await_body_block.expression.right;
              }
              await_body_block.body = awaits_bodies[body_index];
              await_container_parent.body.splice(await_container_position + body_index, 0, await_body_node);
            }
          }
          break;
      }
    }
  });
};
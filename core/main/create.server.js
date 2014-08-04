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

//C: defining create CLI command
global.main.commands.create = function(root, template){
  var skeleton, target, source;
  global.main.commands.logo();
  //C: checking target argument exist
  target = root||native.args.root;
  if (target === undefined){
    throw new Exception('target root folder not specified, please use the --root argument to define target directory');
  }
  //C: checking whether destination forlder exists
  if (native.fs.existsSync(target) === true) {
    throw new Exception('folder \'%s\' already exists',target);
  }
  //C: checking template argument exist
  skeleton = template||native.args.template;
  if (skeleton === undefined){
    skeleton = 'default';
  }
  //C: checking whether skeleton folder exists
  source = native.path.join(global.main.path.core,'core/skel/' + skeleton);
  if (native.fs.existsSync(source) === false){
    throw new Exception('skeleton template \'%s\' not found, please check ljve is correctly installed', skeleton);
  }
  //C: copying skel folder to new root folder
  native.fs.copySync(source, target);
  console.info('created app in \'%s\'', target);
};

//C: defining create CLI command manual
global.main.commands.create.man = function() {
  console.log('\
  Create an application root path from template skeleton.\n\
  \n\
    --root=/var/www/example\n\
    Define the target path where the server will copy new application folder and files.\n\
    \n\
    --template=default\n\
    Specify the template to be used as boilerplate for new application root path.\n\
    If this argument is missing, the \'default\' template will be used.\n\
    \n\
    Templates:\n\
      ');
  var templates = native.fs.readdirSync(native.path.join(global.main.path.core,'core/skel/'));
  templates.forEach(function(template){
    console.log('      %s', template);
  });
};
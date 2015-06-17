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

// defining create CLI command
global.main.commands.create = function(root, template){

  var args = require('yargs').argv;
  var fs = require('fs-extra');
  var path = require('path');

  // processing arguments
  var target = root || args._[2] || args.root || global.main.path.root;
  // checking whether target folder is valid
  if (target != null && typeof target === 'string'){
    // normalizing root (removing last separators)
    target = target.replace(/\/*$|\\*$/,'');
    if (target[0] !== path.sep) {
      target = path.resolve(process.cwd(),target);
    }
    // storing new root folder for parent commands
    global.main.path.root = target;
    if (fs.existsSync(target) === true &&
      fs.statSync(target).isDirectory() === true &&
      fs.readdirSync(target).length > 0) {
      return console.error('folder %s is not empty', target);
    }
  } else {
    return console.error('target root folder not specified, please use the --root argument to define target directory');
  }

  // checking template argument exist
  var skeleton = template || args._[1] || args.template;
  if (skeleton === undefined){
    skeleton = 'default';
  }

  // checking whether skeleton folder exists
  var source = path.join(global.main.path.core,'core/skel/' + skeleton);
  if (fs.existsSync(source) === false || fs.statSync(source).isDirectory() === false){
    return console.error('template %s not found, the following templates are available:\n  %s', skeleton,
      fs.readdirSync(path.join(global.main.path.core,'core/skel/')).join('\n  '));
  }
  // copying skel folder to new root folder
  fs.copySync(source, target);
  console.info('created app from template %s in %s', skeleton, target);
};

// defining create CLI command manual
global.main.commands.create.man = function() {
  var fs = require('fs');
  var path = require('path');

  console.log('\
  create [template] [root]\n\
  Create an application boilerplate from templates.\n\
  \n\
    --root=/var/www/example\n\
    Define the target path where the server will create new application folder and files.\n\
    \n\
    --template=default\n\
    Specify the template to be used as base for the new application.\n\
    If this argument is missing, the \'default\' template will be used.\n\
    \n\
    Templates:\n\
      ');
  var templates = fs.readdirSync(path.join(global.main.path.core,'core/skel/'));
  templates.forEach(function(template){
    console.log('      %s', template);
  });
};
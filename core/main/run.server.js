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

//C: defining run CLI command
global.main.commands.run = function(base){
  //C: processing arguments
  var root = base || native.args.root;
  //C: checking whether root folder is valid
  if (root != null && typeof root === 'string'){
    //C: normalizing root (removing last separators)
    //T: support windows directory separator
    root = root.replace(/\/*$/,'');
    if (native.fs.existsSync(root) === true){
      //C: storing new root folder
      global.main.path.app = native.path.normalize(root);
    } else {
      throw new Exception('specified root folder %s does not exist, please use absolute path', root);
    }
  }

  //C: printing logo
  global.main.commands.logo();
  //C: printing version
  global.main.commands.version.print();

  //C: loading ljve application server
  global.require.main._compile('\n'+require('fs').readFileSync(global.main.path.core + '/core/bootstrap.server.js', { encoding: 'utf-8' })/*,global.main.path.core + '/core/bootstrap.server.js'*/);

  //C: power-on-self-test, initializing application server
  bootstrap.post();

  //C: deleting global.main namespace (not required)
  delete global.main;
};

//C: defining run CLI command manual
global.main.commands.run.man = function() {
  console.log('\
  Start application server.\n\
  \n\
    --root=/var/www\n\
    Define the root path where the server will find application folder and files.\n\
    If this argument is missing, the current working directory will be used.\
  ');
};
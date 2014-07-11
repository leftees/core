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
global.main.commands.create = function(){
  var skel, target, ncp;
  global.main.commands.logo();
  //C: checking required arguments exists
  target = native.args.root;
  if (target === undefined){
    throw new Exception('target root folder not specified, please use the --root argument to define target directory');
  }
  //C: checking whether destination forlder exists
  if (native.fs.existsSync(target) === true) {
    throw new Exception('folder \'%s\' already exists',target);
  }
  //C: checking whether skeleton folder exists
  //T: support skeleton templates (--template=helloworld)
  skel = native.path.join(global.main.path.core,'core/skel/default');
  if (native.fs.existsSync(skel) === false){
    throw new Exception('skeleton folder not found, please check ljve is correctly installed');
  }
  //C: copying skel folder to new root folder
  ncp = require('ncp').ncp;
  ncp.limit = 16;
  ncp(skel, target, function (err) {
    if (err) {
      throw new Exception(err.message, err);
    }
    console.info('created app in \'%s\'', target);
  });
};
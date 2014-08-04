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

//C: defining help CLI command
global.main.commands.help = function() {
  global.main.commands.logo();
  console.log('\n\
Usage: ljve [command] [parameters]\n\
\n\
Supported commands:\n');
  Object.keys(global.main.commands).forEach(function(command){
    if(typeof global.main.commands[command].man === 'function'){
      console.info('  ' + command);
      global.main.commands[command].man();
      console.log();
    }
  });
};

//C: defining help CLI command manual
global.main.commands.help.man = function() {
  console.log('\
  Print this help message.');
};
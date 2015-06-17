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

global.main.commands['_.build.core'] = function () {
  process.env.NODE_ENV = 'development';
  process.env.BUILD = 'pack';
  global.development = true;
  global.debugging = false;

  global.main.commands['run']();
};

// defining dev.build CLI command manual
global.main.commands['_.build.core'].man = function () {
  console.log('\
  _.build.core\n\
  _.build.core\n\
  Compile and pre-build boot and core modules.\
 ');
};
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

//C: defining logo CLI command
global.main.commands.logo = function(){
  console.log('ljve.io - © 2010-2015 Marco Minetti and contributors. All rights reserved.');
  if (false) {
    console.log('This program is licensed under AGPLv3. It\'s free software and comes with absolutely no warranty.\n\
If you need commercial license for closed source projects or technical support, please contact\n\
us at Novetica (http://www.novetica.org).');
  }
};
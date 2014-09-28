/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

//C: defining legal CLI command
global.main.commands.legal = function(){
  //T: read license from LICENSE file
  console.log('ljve.io - Live Javascript Virtualized Environment\n\
Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>\n\
Copyright (C) 2011-2013 Novetica\n\
\n\
This program is free software: you can redistribute it and/or modify\n\
it under the terms of the GNU Affero General Public License as published by\n\
the Free Software Foundation, either version 3 of the License, or\n\
(at your option) any later version.\n\
\n\
This program is distributed in the hope that it will be useful,\n\
but WITHOUT ANY WARRANTY; without even the implied warranty of\n\
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n\
GNU Affero General Public License for more details.\n\
\n\
You should have received a copy of the GNU Affero General Public License\n\
along with this program.  If not, see <http://www.gnu.org/licenses/>.')
};

//C: defining legal CLI command manual
global.main.commands.legal.man = function() {
  console.log('\
  Print copyright and license.');
};
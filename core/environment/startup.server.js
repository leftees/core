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

/**
 * Provides environment management classes and methods.
 * @namespace
*/
platform.environment = platform.environment || {};

platform.environment._init = async function(){
  //TODO: load modules by configuration

  // loading main.js
  if ((await platform.io.backends.root.exists('/app/main.server.js')) === true) {
    app.main = await platform.kernel.load('/app/main.server.js');
  }
};

platform.events.attach('application.ready','app.init',platform.environment._init);
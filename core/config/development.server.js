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
 * Contains global development tools configuration.
 * @type {Object}
*/
platform.configuration.development = {};
platform.configuration.development.tools = {};
platform.configuration.development.tools.console = {};
platform.configuration.development.tools.console.ports = {
  'agent': 9958,
  'ui': 9090
};
platform.configuration.development.tools.console.spawn = true;

platform.configuration.development.tools.inspector = {};
platform.configuration.development.tools.inspector.ports = {
  'ui': 9091
};
platform.configuration.development.tools.inspector.spawn = true;


platform.configuration.development.tools.ide = {};
platform.configuration.development.tools.ide.ports = {
  'ui': 9092
};
platform.configuration.development.tools.ide.spawn = true;



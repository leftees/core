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
 * Contains system related configuration.
 * @type {Object}
*/
platform.configuration.system = {};

/**
 * Contains memory management configuration.
 * @type {Object}
*/
platform.configuration.system.memory = {};

/**
 * Contains memory garbage collector configuration.
 * @type {Object}
*/
platform.configuration.system.memory.gc = {
  /**
   *  Enable or disable garbage collector on memory stats.
  */
  'auto': false,
  /**
   *  Enable or disable forced garbage collector.
  */
  'force': false,
  /**
   *  Define forced garbage collection interval (ms).
  */
  'interval': 1000*60*1
};
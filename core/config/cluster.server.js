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
 * Contains cluster related configuration.
 * @type {Object}
*/
platform.configuration.cluster = {};

/**
 * Contains workers-role scale configuration.
 * @type {Object}
*/
platform.configuration.cluster.workers = {};

/**
 * Defines the number of 'compile' workers that will operate as resource compiler/augmented and changes processor.
 * @alert  By design, only one is currently supported.
*/
platform.configuration.cluster.workers.compile = 1;

/**
 *  Defines the number of 'app' workers that will operate as application server with distributed javascript runtime.
*/
platform.configuration.cluster.workers.app = 'auto';
//platform.configuration.cluster.workers.app = 4;

/**
 * Defines the number of 'runtime' workers that will operate as distributed javascript runtime variable store.
 * @alert  By design, only one is currently supported.
*/
platform.configuration.cluster.workers.runtime = 1;

/**
 * Defines the number of 'socket' workers that will operate as statistics server/aggregator.
 * @alert  By design, only one is currently supported.
*/
platform.configuration.cluster.workers.socket = 1;
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
 * Contains global debug configuration.
 * @type {Object}
*/
platform.configuration.debug = {};
platform.configuration.debug.exception = false;
/**
 *  Enable or disable global verbose HTTP debug log.
*/
platform.configuration.debug.http = false;
/**
 *  Enable or disable global verbose WebSocket debug log.
*/
platform.configuration.debug.websocket = false;
/**
 *  Enable or disable global verbose memory watcher debug log.
*/
platform.configuration.debug.memory = false;
/**
 *  Enable or disable global verbose code load debug log.
*/
platform.configuration.debug.load = true;
/**
 *  Enable or disable global verbose cache debug log.
*/
platform.configuration.debug.cache = true;
/**
 *  Enable or disable global verbose session debug log.
*/
//platform.configuration.debug.session = true;
/**
 *  Enable or disable global verbose bootstrap debug log.
*/
//platform.configuration.debug.bootstrap = true;
platform.configuration.debug.messaging = {};
platform.configuration.debug.messaging.mail = true;
//platform.configuration.debug.handler = true;
//platform.configuration.debug.fastcgi = false;
platform.configuration.debug.parser = {};
platform.configuration.debug.parser.js = false;
platform.configuration.debug.kernel = {};
platform.configuration.debug.kernel.preprocess = true;
platform.configuration.debug.kernel.runlevel = true;
platform.configuration.debug.kernel.profile = true;
platform.configuration.debug.kernel.function = {};
platform.configuration.debug.kernel.function.named = false;
platform.configuration.debug.kernel.function.unknown = false;
platform.configuration.debug.kernel.function.object = false;
platform.configuration.debug.object = {};
platform.configuration.debug.object.property = {};
platform.configuration.debug.object.property.define = false;
platform.configuration.debug.object.property.set = false;
platform.configuration.debug.object.property.get = false;
platform.configuration.debug.object.property.runtime = false;
platform.configuration.debug.runtime = false;
//platform.configuration.debug.object.property.persist = true;
//platform.configuration.debug.object.property.prelink = true;
platform.configuration.debug.filesystem = {};
platform.configuration.debug.filesystem.change = {};
platform.configuration.debug.filesystem.change.loaded = true;
platform.configuration.debug.filesystem.change.other = false;
platform.configuration.debug.database = true;
/**
 *  Enable or disable global verbose event debug log.
*/
platform.configuration.debug.event = false;
/**
 *  Enable or disable global verbose IPC debug log.
*/
platform.configuration.debug.ipc = false;
platform.configuration.debug.ipc_dump = false;
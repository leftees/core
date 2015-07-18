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
 * Contains bootstrap configuration.
 * @type {Object}
*/
platform.configuration.bootstrap = {};

/**
 * Contains configuration schemas for node roles.
 * @type {Object}
*/
platform.configuration.bootstrap.config = {};

/**
 *  Defines the common configuration files that will be loaded in every nodes role.
*/
platform.configuration.bootstrap.config.generic = [
  'app.server.js',
  'runtime.server.js',
  'debug.server.js',
  'kernel.server.js',
  'cluster.server.js',
  'ipc.server.js',
  'cache.server.js',
  'system.server.js',
  'development.server.js',
  'http.server.js',
  'database.server.js',
  'mail.server.js'
];

/**
 *  Defines the configuration files for 'master' node.
*/
platform.configuration.bootstrap.config.master = [

];

/**
 *  Defines the configuration files for 'compile' role.
*/
platform.configuration.bootstrap.config.compile = [

];

/**
 *  Defines the configuration files for 'app' role.
*/
platform.configuration.bootstrap.config.app = [

];

/**
 *  Defines the configuration files for 'runtime' role.
*/
platform.configuration.bootstrap.config.runtime = [

];

/**
 *  Defines the configuration files for 'socket' role.
*/
platform.configuration.bootstrap.config.socket = [

];

/**
 * Contains bootstrap modules schemas for node roles.
 * @type {Object}
 * @alert Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init = {};

/**
 * Defines the bootstrap modules that will be pre-loaded in every nodes role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init.generic = [
  'development/inspector.server.js',
  'development/console.server.js',
  'utility/recursive.server.js',
  'utility/function.server.js',
  'utility/hash.server.js',
  'utility/json.server.js',
  'kernel/kernel.server.js',
  'kernel/array.server.js',
  'kernel/object.server.js',
  'kernel/classes.server.js',
  'events/event.server.js',
  'cluster/cluster.server.js',
  'cluster/protocols.server.js',
  'cluster/ipc.server.js',
  'io/backend/disk.server.js',
  'io/store.server.js',
  'io/io.server.js',
  'io/cache.server.js',
  'cluster/kernel/kernel.server.js',
  'cluster/kernel/preprocess.server.js',
  'cluster/events/remote.server.js',
  'cluster/runtime/runtime.server.js',
  'system/npm.server.js'
];

/**
 * Defines the bootstrap modules that will be pre-loaded for 'master' node.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init.master = [
  'development/ide.server.js'
];

/**
 * Defines the bootstrap modules that will be pre-loaded for 'compile' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init.compile = [
  'parser/js.server.js',
  'kernel/preprocess.server.js',
  'kernel/preprocessors/node.naming.server.js',
  'kernel/preprocessors/function.logging.server.js',
  'kernel/preprocessors/function.reflection.server.js',
  //'kernel/preprocessors/code.blocking.server.js',
  'kernel/preprocessors/code.leveling.server.js',
  'kernel/preprocessors/code.breakpoint.server.js',
  'kernel/preprocessors/code.profiling.server.js',
  'kernel/preprocessors/runtime.define.server.js',
  'kernel/preprocessors/runtime.lock.server.js',
  //'kernel/preprocessors/sourcemap.stack.server.js',
  'kernel/preprocessors/exception.dump.server.js',
  'development/live.server.js'
];

/**
 * Defines the bootstrap modules that will be pre-loaded 'app' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init.app = [
];

/**
 * Defines the bootstrap modules that will be pre-loaded 'runtime' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init.runtime = [
  'runtime/runtime.server.js',
  'cluster/runtime/protocol.server.js'
];

/**
 * Defines the bootstrap modules that will be pre-loaded 'socket' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init.socket = [
];

/**
 * Contains bootstrap modules schemas for node roles.
 * @type {Object}
 * @alert Ignored/hardcoded within boot pack during building.
 */
platform.configuration.bootstrap.core = {};

/**
 * Defines the bootstrap modules that will be loaded in every nodes role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core.generic = [
  'system/memory.server.js',
  'system/cpu.server.js',
  'system/uv.server.js',
  'statistics/stat.server.js',
  'cluster/statistics/stat.server.js',
  'cluster/system/memory.server.js',
  'cluster/system/cpu.server.js',
  'cluster/system/uv.server.js',
  'messaging/mail/mail.server.js',
  'database/database.server.js'
];

/**
 * Defines the bootstrap modules that will be loaded for 'master' node.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core.master = [
];

/**
 * Defines the bootstrap modules that will be loaded 'compile' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core.compile = [
];

/**
 * Defines the bootstrap modules that will be loaded 'app' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core.app = [
  'http/context.server.js',
  'http/engine.server.js',
  'http/engine/auth.server.js',
  'http/engine/send.server.js',
  'http/parsers/form.server.js',
  'http/parsers/html.server.js',
  'http/parsers/json.server.js',
  'http/parsers/multipart.server.js',
  'http/parsers/plain.server.js',
  'http/parsers/xml.server.js',
  'http/http.server.js',
  'accounts/init.server.js',
  'environment/startup.server.js'
];

/**
 * Defines the bootstrap modules that will be loaded 'runtime' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core.runtime = [
];

/**
 * Defines the bootstrap modules that will be loaded 'socket' role.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core.socket = [
];
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
 *  Defines the configuration files that will be loaded in core mode.
*/
platform.configuration.bootstrap.config = [
  'app.server.js',
  'runtime.server.js',
  'debug.server.js',
  'kernel.server.js',
  'cache.server.js',
  'system.server.js',
  'development.server.js',
  'http.server.js',
  'database.server.js',
  'mail.server.js'
];

/**
 * Defines the bootstrap modules that will be pre-loaded in core mode.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.init = [
  'utility/recursive.server.js',
  'utility/function.server.js',
  'utility/hash.server.js',
  'utility/json.server.js',
  'kernel/kernel.server.js',
  'kernel/array.server.js',
  'kernel/object.server.js',
  'kernel/classes.server.js',
  'events/event.server.js',
  'io/backend/disk.server.js',
  'io/store.server.js',
  'io/io.server.js',
  'io/cache.server.js',
  'system/npm.server.js',
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
  'runtime/runtime.server.js',
  'development/inspector.server.js',
  'development/console.server.js',
  'development/live.server.js',
  'development/ide.server.js'
];

/**
 * Defines the bootstrap modules that will be loaded in core mode.
 * @alert  Ignored/hardcoded within boot pack during building.
*/
platform.configuration.bootstrap.core = [
  'system/memory.server.js',
  'system/cpu.server.js',
  'system/uv.server.js',
  'statistics/stat.server.js',
  'messaging/mail/mail.server.js',
  'database/database.server.js',
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
  'environment/startup.server.js'
];
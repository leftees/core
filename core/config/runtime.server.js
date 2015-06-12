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
 * Provides platform runtime namepace for automatic/volatile data.
 * @namespace
*/
platform.configuration.runtime = platform.configuration.runtime || {};

/**
 * Contains runtime automatic/volatile data (app related).
 * @namespace
*/
platform.configuration.runtime.app = platform.configuration.runtime.app || {};

/**
 * Contains runtime automatic/volatile data (core related).
 * @namespace
*/
platform.configuration.runtime.core = platform.configuration.runtime.core || {};

/**
 * Contains runtime automatic/volatile data (environment related).
 * @namespace
*/
platform.configuration.runtime.env = platform.configuration.runtime.env || {};

// populating runtime environment related data
platform.configuration.runtime.env.vendor = 'node.js';
platform.configuration.runtime.env.version = process.version;
platform.configuration.runtime.env.os = platform.configuration.runtime.env.os || {};
platform.configuration.runtime.env.os.platform = process.platform;
platform.configuration.runtime.env.os.arch = process.arch;

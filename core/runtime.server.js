'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

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

//N: Contains platform shared configuration.
platform.configuration = platform.configuration || {};

//N: Contains platform runtime configuration for automatic/volatile data.
platform.configuration.runtime = platform.configuration.runtime || {};

//N: Contains platform runtime configuration for automatic/volatile data (app related).
platform.configuration.runtime.app = platform.configuration.runtime.app || {};

//N: Contains platform runtime configuration for automatic/volatile data (core related).
platform.configuration.runtime.core = platform.configuration.runtime.core || {};

//N: Contains platform runtime configuration for automatic/volatile data (environment related).
platform.configuration.runtime.env = platform.configuration.runtime.env || {};

//C: populating runtime environment related data
platform.configuration.runtime.env.vendor = 'node.js';
platform.configuration.runtime.env.version = process.version;
platform.configuration.runtime.env.os = platform.configuration.runtime.env.os || {};
platform.configuration.runtime.env.os.platform = process.platform;
platform.configuration.runtime.env.os.arch = process.arch;

//C: moving global env configuration to runtime.env namespace
platform.configuration.runtime.env.debugging = global.debugging;
platform.configuration.runtime.env.development = global.development;
platform.configuration.runtime.env.testing = global.testing;
delete global.debugging;
delete global.development;
delete global.testing;
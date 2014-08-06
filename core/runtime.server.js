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

//N: Provides platform runtime namepace for automatic/volatile data.
platform.runtime = platform.runtime || {};

//N: Contains runtime automatic/volatile data (app related).
platform.runtime.app = platform.runtime.app || {};

//N: Contains runtime automatic/volatile data (core related).
platform.runtime.core = platform.runtime.core || {};

platform.runtime.core = platform.runtime.core || {};

//N: Contains runtime automatic/volatile data (environment related).
platform.runtime.env = platform.runtime.env || {};

//C: populating runtime environment related data
platform.runtime.env.vendor = 'node.js';
platform.runtime.env.version = process.version;
platform.runtime.env.os = platform.runtime.env.os || {};
platform.runtime.env.os.platform = process.platform;
platform.runtime.env.os.arch = process.arch;

//C: moving global environment to runtime.env namespace
platform.runtime.debugging = platform.runtime.debugging||global.debugging;
platform.runtime.development = platform.runtime.development||global.development;
platform.runtime.testing = platform.runtime.testing||global.testing;
delete global.debugging;
delete global.development;
delete global.testing;

//C: moving global environment to runtime.env namespace
platform.runtime.path = platform.runtime.path||global.main.path;

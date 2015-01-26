#!/usr/bin/env node
'use strict';
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

//C: storing the current time as process start datetime
process.startTime = Date.now();

//C: exporting global require against server root (needed later)
global.require = require;

//C: backporting partial ECMAScript 6 features (through injection of hidden javascript file)
global.require.main._compile('\n'+require('fs').readFileSync(__dirname + '/core/polyfill.server.js'),__dirname + '/core/polyfill.server.js');

//C: starting executable stub (through injection of hidden javascript file)
global.require.main._compile('\n'+require('fs').readFileSync(__dirname + '/core/exec.server.js'));

//C: invalidating main file from require cache
delete global.require.cache[global.require.main.filename];

//C: replacing main javascript file to automatically open custom file to debugger
global.require.main.filename = __dirname + '/main.readme.txt';


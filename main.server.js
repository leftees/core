#!/usr/bin/env node
'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014 Marco Minetti <marco.minetti@novetica.org>

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

//C: exporting global require against server root (needed later)
global.require = require;

global.require.main._compile('\n'+require('fs').readFileSync(__dirname + '/core/polyfill.server.js', { encoding: 'utf-8' })/*,__dirname + '/core/polyfill.server.js'*/);

//C: starting executable stub
global.require.main._compile('\n'+require('fs').readFileSync(__dirname + '/core/exec.server.js', { encoding: 'utf-8' })/*,__dirname + '/core/exec.server.js'*/);

global.require.main.filename = null;
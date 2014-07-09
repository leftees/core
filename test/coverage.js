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

//C: preventing console logging that could corrupt coverage output stream
['log', 'warn', 'info', 'error', 'debug', 'dir'].forEach(function (level) {
  native.console[level] = function(){};
});

//C: loading blanket coverage tool with shortname disable if running in testing environment (assuming CI)
require('blanket')({
  "pattern": [ "core", "app" ],
  "data-cover-never": [ "external", "node_modules" ],
  "data-cover-reporter-options": {
    "shortnames": ((global.testing === false) ? true : false)
  }
});
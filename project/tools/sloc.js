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

var stdin = process.stdin;
var stdout = process.stdout;
var data = [];

stdin.resume();
stdin.setEncoding('utf8');
stdin.on('data', function (chunk) {
  data.push(chunk);
});

stdin.on('end', function () {
  var json = data.join();
  var result = JSON.parse(json);
  var coverage = Math.floor((result.summary.single + result.summary.mixed) / result.summary.source*100);
  var color = (coverage > 40) ? 'green' : (coverage < 10) ? 'red' : 'yellow';

  var url = 'http://img.shields.io/badge/comments-' + coverage + '%-' + color + '.png?style=flat';
  stdout.write(url);
});
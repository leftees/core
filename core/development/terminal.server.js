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

var tty = require('ljve-terminal');

var app = tty.createServer({
  "users": {
  },
  /*"https": {
    "key": "./server.key",
    "cert": "./server.crt"
  },*/
  "port": 9093,
  "hostname": "0.0.0.0",
  "shell": "bash",
  //"shellArgs": ["arg1", "arg2"],
  "limitGlobal": 1000,
  "limitPerUser": 100,
  "localOnly": false,
  "cwd": process.cwd(),
  "syncSession": true,
  "sessionTimeout": 300000,
  "log": false,
  "io": { "log": true },
  "debug": false,
  "term": {
    "termName": "xterm",
    "geometry": [80, 24],
    "scrollback": 0,
    "visualBell": true,
    "popOnBell": true,
    "cursorBlink": true,
    "screenKeys": true,
    "colors": [
      "#2e3436",
      "#cc0000",
      "#4e9a06",
      "#c4a000",
      "#3465a4",
      "#75507b",
      "#06989a",
      "#d3d7cf",
      "#555753",
      "#ef2929",
      "#8ae234",
      "#fce94f",
      "#729fcf",
      "#ad7fa8",
      "#34e2e2",
      "#eeeeec"
    ]
  }
});

app.setAuth(function(a,b,c){
 c();
});

app.listen();

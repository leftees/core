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

  var badge = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="120" height="18" id="svg2" version="1.1"><metadata id="metadata35"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /></cc:Work></rdf:RDF></metadata><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7" id="stop5" /><stop offset=".1" stop-color="#aaa" stop-opacity=".1" id="stop7" /><stop offset=".9" stop-opacity=".3" id="stop9" /><stop offset="1" stop-opacity=".5" id="stop11" /></linearGradient><rect rx="4" width="120" height="18" fill="#555" id="rect13" /><rect rx="3.0797322" x="79.19355" width="40.80645" height="18" id="rect15" y="0" style="fill:#44cc11" /><path d="m 77,0 h 4 v 18 h -4 z" id="path17" style="fill:#44cc11" /><rect rx="4" width="120" height="18" id="rect19" fill="url(#a)" /><g font-size="11" id="g21" transform="translate(16,0)" style="font-size:11px;text-anchor:middle;fill:#ffffff;font-family:\'DejaVu Sans,Verdana,Geneva,sans-serif\'"><text x="21.5" y="13" id="text23" style="fill:#010101;fill-opacity:0.3">comments</text><text x="21.5" y="12" id="text25">comments</text><text x="81.5" y="13" id="text27" style="fill:#010101;fill-opacity:0.3">100%</text><text x="81.5" y="12" id="text29">100%</text></g></svg>';

  stdout.write(badge.replace(/100\%/g,coverage+'%'));
});
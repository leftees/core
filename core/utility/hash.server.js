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
 * Provides utility and functions to support development and execution.
 * @namespace
*/
platform.utility = platform.utility || {};

// extending String object (not prototype) with hashing implementations
String.hash = String.hash || {};

/**
 * Returns hash with Jenkins algorithm.
 * @param {} data Specifies the string to be hashed.
*/
String.hash.jenkins = function(data) {
  var data_buffer = new Uint32Array(new Buffer(data));

  var uint_slots = new Uint32Array(3);

  var len = data_buffer.length;
  uint_slots[0] = uint_slots[1] = 0x9e3779b9;
  uint_slots[2] = 0;
  var i = 0;
  while (i + 12 <= len)
  {
    uint_slots[0] += data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i++] << 24);
    uint_slots[1] += data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i++] << 24);
    uint_slots[2] += data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i++] << 24);
    uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>13);
    uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<8);
    uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>13);
    uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>12);
    uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<16);
    uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>5);
    uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>3);
    uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<10);
    uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>15);
  }
  uint_slots[2] += len;
  if (i < len)
    uint_slots[0] += data[i++];
  if (i < len)
    uint_slots[0] += data[i++] << 8;
  if (i < len)
    uint_slots[0] += data[i++] << 16;
  if (i < len)
    uint_slots[0] += data[i++] << 24;
  if (i < len)
    uint_slots[1] += data[i++];
  if (i < len)
    uint_slots[1] += data[i++] << 8;
  if (i < len)
    uint_slots[1] += data[i++] << 16;
  if (i < len)
    uint_slots[1] += data[i++] << 24;
  if (i < len)
    uint_slots[2] += data[i++] << 8;
  if (i < len)
    uint_slots[2] += data[i++] << 16;
  if (i < len)
    uint_slots[2] += data[i++] << 24;
  uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>13);
  uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<8);
  uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>13);
  uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>12);
  uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<16);
  uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>5);
  uint_slots[0] -= uint_slots[1]; uint_slots[0] -= uint_slots[2]; uint_slots[0] ^= (uint_slots[2]>>3);
  uint_slots[1] -= uint_slots[2]; uint_slots[1] -= uint_slots[0]; uint_slots[1] ^= (uint_slots[0]<<10);
  uint_slots[2] -= uint_slots[0]; uint_slots[2] -= uint_slots[1]; uint_slots[2] ^= (uint_slots[1]>>15);
  return uint_slots[2];
};

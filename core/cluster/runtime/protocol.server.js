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

platform.cluster.ipc.protocols.register('runtime.get',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to get

  try {
    callback(null,runtime.get(data.name));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.getmeta',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to get

  try {
    callback(null,runtime.getMeta(data.name));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.getrevision',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to get

  try {
    callback(null,runtime.getRevision(data.name));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.tryget',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to get
  // {}.revision: revision of the variable to get

  try {
    callback(null,runtime.tryGet(data.name,data.revision));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.create',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to get

  try {
    if (callback != null) {
      callback(null, runtime.reate(data.name));
    } else {
      runtime.create(data.name);
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    }
  }
},true);

platform.cluster.ipc.protocols.register('runtime.set',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to set
  // {}.value: value to set

  try {
    if (callback != null) {
      callback(null, runtime.set(data.name, data.value,client.id));
    } else {
      runtime.set(data.name, data.value,client.id);
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    }
  }
},true);

platform.cluster.ipc.protocols.register('runtime.tryset',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to set
  // {}.value: value to set
  // {}.revision: revision of the variable to set

  try {
    callback(null,runtime.trySet(data.name,data.value,data.revision,client.id));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.isupdated',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to check
  // {}.revision: revision of the variable to check

  try {
    callback(null,runtime.isUpdated(data.name,data.revision));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.subscribe',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to subscribe
  // {}.id: subscriber node id

  try {
    callback(null,runtime.subscribe(data.name,data.id));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.unsubscribe',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to unsubscribe
  // {}.id: subscriber node id

  try {
    callback(null,runtime.unsubscribe(data.name,data.id));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.issubscribed',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to check subscription
  // {}.id: subscriber node id

  try {
    callback(null,runtime.isSubscribed(data.name,data.id));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.waitandlock',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to lock

  try {
    runtime.waitAndLock(data.name,callback);
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.lock',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to lock

  try {
    callback(null,runtime.lock(data.name));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.unlock',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to unlock
  // {}.lockid: unlock id

  try {
    callback(null,runtime.unlock(data.name,data.lockid));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.clearlock',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to unlock

  try {
    callback(null,runtime.clearLock(data.name));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.islocked',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to check lock

  try {
    callback(null,runtime.isLocked(data.name));
  } catch(err) {
    callback(err);
  }
},true);

platform.cluster.ipc.protocols.register('runtime.getcurrentlock',function(client,data,callback){
  // packet specification
  // {}.name: name of the variable to check lock

  try {
    callback(null,runtime.getCurrentLock(data.name));
  } catch(err) {
    callback(err);
  }
},true);
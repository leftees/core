/*

 ljve.io  - Live Javascript Virtualized Environment
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
 * Contains cluster namespace with related objects and methods.
 * @namespace
*/
platform.cluster = platform.cluster || {};

/**
 * Contains current worker data and objects.
 * @type {Object}
*/
platform.cluster.worker = platform.cluster.worker || {};

/**
 *  Stores the current worker role, as string.
*/
platform.cluster.worker.role = process.env['CLUSTER_NODE_ROLE'] || 'master';

/**
 * Stores the current worker type (by connection): unix (only one supported)
 * @alert  currently only unix sockets are supported for IPC (no cross-server support)
*/
//TODO: support remote/cross-server worker types
platform.cluster.worker.type = 'unix';

/**
 *  Stores the current worker process id.
*/
platform.cluster.worker.pid = process.pid;

/**
 *  Stores whether the current worker is master (cluster.isMaster)
*/
platform.cluster.worker.master = native.cluster.isMaster;

/**
 *  Stores the current worker object from the native nodejs cluster module.
*/
platform.cluster.worker.native = native.cluster.worker;

/**
 *  Stores the current worker debug port.
*/
platform.cluster.worker.debugPort = process.debugPort;

/**
 * Stores the current worker id, as string.
 * @alert  Currently based on native nodejs cluster module, that is a stringified number (master is 0).
*/
platform.cluster.worker.id = process.env['CLUSTER_NODE_ID'] || ((native.cluster.worker) ? ('?' + native.cluster.worker.id.toString() + '?') : 'master');

/**
 * Stores the cluster workers object based on native nodejs cluster module.
 * @type {Object}
*/
platform.cluster.workers = platform.cluster.workers || native.cluster.workers || {};

platform.events.register('cluster.init',null,null,true);
platform.events.register('cluster.ready',null,null,true);

if (platform.state === platform._states.PRELOAD){

  if (platform.cluster.worker.master === true){

    // assuring configuration is valid for cluster nodes size (against design)
    platform.configuration.cluster.workers.compile = 1;
    platform.configuration.cluster.workers.runtime = 1;
    platform.configuration.cluster.workers.socket = 1;
    if (platform.configuration.cluster.workers.app < 1 || platform.configuration.runtime.debugging === true){
      platform.configuration.cluster.workers.app = 1;
    }

    platform.cluster._init = async function () {
      native.cluster.schedulingPolicy = native.cluster.SCHED_NONE;
      var node_ids = [];
      // creating any role type found within cluster configuration
      Object.keys(platform.configuration.cluster.workers).forEach(function (role) {
        // getting the total number of nodes for current role type
        var count = platform.configuration.cluster.workers[role];
        // handling zero values (equals to CPU cores) and 0<x<1 values (equals to CPU cores fraction)
        if (count === 'auto') {
          count = native.os.cpus().length;
        }
        if (count === 0) {
          count = 1;
        }
        var index = count;
        do {
          var node_id = role;
          if (count !== 1) {
            node_id += '.' + (count - index);
          };
          node_ids.push(node_id);
          //TODO: handle errors and exit events for cluster nodes
          // forking cluster nodes with current environment, node role and master IPC server as unix socket path
          native.cluster.fork(native.util._extend(native.util._extend({}, process.env), {
            'CLUSTER_NODE_ROLE': role,
            'CLUSTER_NODE_ID': node_id,
            'CLUSTER_MASTER_URI': platform.cluster.worker.ipc.server[(process.platform==='win32')?'tcp':'unix'].uri
            //,'MAIN_COMMAND': 'cluster.run.server.js'
          }));
        } while (--index);
      });

      await platform.events.wait('cluster.ipc.handshake',function(id){
        var node_id_index = node_ids.indexOf(id);
        if (node_id_index !== -1) {
          node_ids.splice(node_id_index, 1);
        }
        if (node_ids.length === 0){
          return true;
        }
        return false;
      });

      var node_targets = [];
      node_ids = Object.keys(platform.cluster.ipc.connections);
      node_ids.splice(node_ids.indexOf(platform.cluster.worker.id),1);
      node_ids.slice(0).forEach(function(id){
        var node_id_index = node_ids.indexOf(id);
        if (node_id_index !== -1) {
          node_ids.splice(node_id_index, 1);
        }
        if (node_ids.length === 0){
          return;
        }
        if (process.platform === 'win32'){
          node_targets.push({
            'destination': platform.cluster.ipc.connections[id].uri.remote,
            'ids': node_ids.slice(0)
          });
        } else {
          node_targets.push({
            'destination': 'unix://'+id,
            'ids': node_ids.slice(0)
          });
        }
      });

      await node_targets.forEachAwait(async function(target_object) {
        await platform.cluster.ipc.remote.connect(target_object.ids, target_object.destination);
      });

      await platform.events.remote.raise('!', 'cluster.init');
      await platform.events.raise('cluster.init');

      await platform.events.remote.raise('!', 'cluster.ready');
      await platform.events.raise('cluster.ready');
    };

    platform.events.attach('core.init','cluster.init',platform.cluster._init);
  } else {
    platform.events.attach('core.init','cluster.init',async function () {
      await platform.events.wait('cluster.ready');
    });
  }

  /**
   * Provides access to cluster node properties.
   * @namespace cluster
   */
  global.cluster = global.cluster || {};
  Object.defineProperty(global,'cluster',{ 'enumerable': false });

  platform.events.attach('core.ready','cluster.wrapper.init',async function(){
    var node_ids = Object.keys(platform.cluster.ipc.connections);
    node_ids.splice(node_ids.indexOf(platform.cluster.worker.id),1);
    await node_ids.forEachAwait(async function(destination) {
      global.cluster[destination] = await platform.cluster.kernel.wrap(destination,'platform',true,true,false,false,['cluster','configuration','utility','database'])
    });
    global.cluster['apps'] = await platform.cluster.kernel.wrap('app*','platform',true,true,false,false,['cluster','configuration','utility','database'])
    global.cluster['all'] = await platform.cluster.kernel.wrap('*','platform',true,true,false,false,['cluster','configuration','utility','database'])
  });

}
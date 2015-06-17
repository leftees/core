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
 * Contains global event namespace objects and methods.
 * @namespace
*/
platform.events = platform.events || {};

platform.events.remote = platform.events.remote || {};
platform.events.remote._store = platform.events.remote._store || {};

//TODO: implement attachBefore,attachAfter,moveBefore,moveAfter,attachers.list,attachers.getIndex,attachers.get,...

//INIT_OVERRIDE

/**
 * Attach a new callback to an event.
 * @param {} event Specifies the name of the event.
*/
platform.events.attach = function(event,attacher,raiseCallbackOrDestination,interval,conservative,filter){
  if (platform.events.attachers.isValidName(attacher) === false) {
    throw new Exception('attacher name %s for event %s is not valid',attacher,event);
  }
  //TODO: check raiseCallback type, string value for remote attachers
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var attacher_internal = attacher;
    var attacher_class = Attacher;
    var event_object = platform.events._store[event];
    if (typeof raiseCallbackOrDestination !== 'function') {
      attacher = attacher + '@' + raiseCallbackOrDestination;
      attacher_class = RemoteAttacher;
    }
    // checking whether an existing attacher with same name exists
    if (event_object.attachers.hasOwnProperty(attacher) === false) {
      // compiling filter as json schema v4
      if(filter != null && typeof filter === 'object'){
        filter = native.validator.json(filter);
      } else {
        filter = null;
      }
      // creating new attacher
      event_object.attachers[attacher] = new attacher_class(event,attacher_internal,raiseCallbackOrDestination,interval,conservative,filter);
      // adding attacher to the stack
      event_object.order.push(attacher);
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s attached to event %s at index %s (interval: %s, conservative: %s, filter: %s)',attacher,event,event_object.order.indexOf(attacher),(interval)?interval:'none',(conservative)?conservative:false,(filter!=null));
      }
    } else {
      throw new Exception('attacher %s already exists for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Unregisters a global event.
 * @param {} event Specifies the name of the event to be unregistered.
 * @return {} Returns true if the protocol has been unregistered.
*/
platform.events.unregister = function(event){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    // clearing timeouts for conservative sampling throughout all attachers
    var event_object = platform.events._store[event];
    Object.keys(event_object.attachers).forEach(function(attacher){
      var attacher_object = event_object.attachers[attacher];
      var timeout = attacher_object.sampling.timeout;
      if (timeout != null) {
        clearTimeout(timeout);
        if (platform.configuration.debug.event === true){
          console.debug('attacher %s delayed raise for event %s cleared',attacher,event);
        }
      }
      if (attacher_object.destination != null) {
        platform.cluster.ipc._send(attacher_object.destination,'events.detach.clean',{
          'event': event,
          'attacher': attacher_object.name
        });
      }
    });
    // deleting event object
    delete platform.events._store[event];
    if (platform.configuration.debug.event === true){
      console.debug('event %s unregistered',event);
    }
    return true;
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

//END_OVERRIDE

/**
 * Raises a remote event.
 * @param {} event Specifies the name of the event.
*/
platform.events.remote.raise = function(destinations,event/*,[...]*/){
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  args.shift();

  var callback = native.util.makeHybridCallbackPromise();

  platform.cluster.ipc.sendAwait(destinations,'events.raise',{
    'event': event,
    'args': args
  },function(errors,results){
    results = errors || results;
    if (Array.isArray(results) === false){
      results = [results];
      if (errors != null) {
        results.failed = [destinations];
        results.succeed = [];
      } else {
        results.failed = [];
        results.succeed = [destinations];
      }
      results.destinations = [destinations];
    }
    if (platform.configuration.debug.event === true){
      results.failed.forEach(function(destination){
        var error = results[results.destinations.indexOf(destination)];
        console.error('remote event %s not raised at node %s: %s',event,destination,error.stack || error.message);
        if (platform.configuration.debug.exception === true) {
          console.dir(error);
        }
      });
    }
    if (platform.configuration.debug.event === true){
      results.succeed.forEach(function(destination){
        console.debug('remote event %s raised at node %s',event,destination);
      });
    }
    if (errors != null){
      callback.reject(results.failed);
    } else {
      callback.resolve(results.succeed);
    }
  });

  return callback.promise;
};

// registering 'events.raise' protocol to provide remote event raise support
platform.cluster.ipc.protocols.register('events.raise',function(client,data,callback){
  // packet specification
  // {}.event:
  // {}.args:

  try {
    if (callback != null) {
      if (platform.configuration.debug.event === true){
        console.debug('event %s raised from node %s',data.event,client.id);
      }
      var result = platform.events.raise.apply(null,[data.event].concat(data.args));
      if (result != null && result.constructor === Promise) {
        result.then(function(){
          callback(null);
        },function(error){
          callback(error);
        });
      } else {
        callback(null,result);
      }
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught raising remote event %s at node %s: %s', data.event, client.id, err.message);
      }
    }
  }
},true);

/**
 * Attach a new callback to a remote event.
 * @param {} event Specifies the name of the event.
*/
platform.events.remote.attach = function(destinations,event,attacher,raiseCallback,interval,conservative,filter,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'events.attach',{
    'event': event,
    'attacher': attacher,
    'interval' : interval,
    'conservative' : conservative,
    'filter': filter
  },function(errors,results){
    results = errors || results;
    if (Array.isArray(results) === false){
      results = [results];
      if (errors != null) {
        results.failed = [destinations];
        results.succeed = [];
      } else {
        results.failed = [];
        results.succeed = [destinations];
      }
      results.destinations = [destinations];
    }
    if (platform.configuration.debug.event === true){
      results.failed.forEach(function(destination){
        var error = results[results.destinations.indexOf(destination)];
        console.error('attacher %s not attached to remote event %s at node %s: %s',attacher,event,destination,error.stack || error.message);
        if (platform.configuration.debug.exception === true) {
          console.dir(error);
        }
      });
    }
    results.succeed.forEach(function(destination) {
      var remote_event_object = platform.events.remote._store[event] = platform.events.remote._store[event] || {'attachers': {}};
      remote_event_object.attachers[attacher + '@' + destination] = new RemoteAttacherShadow(event, attacher, destination, raiseCallback, interval, conservative, filter);
      if (platform.configuration.debug.event === true) {
        console.debug('attacher %s attached to remote event %s at node %s (interval: %s, conservative: %s, filter: %s)', attacher, event, destination, (interval) ? interval : 'none', (conservative) ? conservative : false, (filter != null));
      }
    });
    if (errors != null){
      callback.reject(results.failed);
    } else {
      callback.resolve(results.succeed);
    }
  });

  return callback.promise;
};

// registering 'events.attach' protocol to provide remote event attach support
platform.cluster.ipc.protocols.register('events.attach',function(client,data,callback){
  // packet specification
  // {}.event:
  // {}.attacher:
  // {}.interval:
  // {}.conservative:
  // {}.filter:

  try {
    if (callback != null) {
      callback(null,platform.events.attach(data.event,data.attacher,client.id,data.interval,data.conservative,data.filter));
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught attaching %s to remote event %s at node %s: %s', data.attacher, data.event, client.id, err.message);
      }
    }
  }
},true);

/**
 * Detach an existing attacher from a remote event.
 * @param {} event Specifies the name of the event.
*/
platform.events.remote.detach = function(destinations,event,attacher,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(destinations,'events.detach',{
    'event': event,
    'attacher': attacher
  },function(errors,results){
    results = errors || results;
    if (Array.isArray(results) === false){
      results = [results];
      if (errors != null) {
        results.failed = [destinations];
        results.succeed = [];
      } else {
        results.failed = [];
        results.succeed = [destinations];
      }
      results.destinations = [destinations];
    }
    if (platform.configuration.debug.event === true){
      results.failed.forEach(function(destination){
        var error = results[results.destinations.indexOf(destination)];
        console.error('attacher %s not detached from remote event %s at node %s: %s',attacher,event,destination,error.stack || error.message);
        if (platform.configuration.debug.exception === true) {
          console.dir(error);
        }
      });
    }
    results.succeed.forEach(function(destination) {
      var remote_event_object = platform.events.remote._store[event] = platform.events.remote._store[event] || { 'attachers': {} };
      delete remote_event_object.attachers[attacher+'@'+destination];
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s detached from remote event %s at node %s',attacher,event,destination);
      }
    });
    if (errors != null){
      callback.reject(results.failed);
    } else {
      callback.resolve(results.succeed);
    }
  });

  return callback.promise;
};

// registering 'events.detach' protocol to provide remote event detach support
platform.cluster.ipc.protocols.register('events.detach',function(client,data,callback){
  // packet specification
  // {}.event:
  // {}.attacher:

  try {
    if (callback != null) {
      callback(null,platform.events.detach(data.event,data.attacher+'@'+client.id));
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught detaching %s from remote event %s at node %s: %s', data.attacher, data.event, client.id, err.message);
      }
    }
  }
},true);

// registering 'events.detach.clean' protocol to provide remote event internal detach support
platform.cluster.ipc.protocols.register('events.detach.clean',function(client,data){
  // packet specification
  // {}.event:
  // {}.attacher:

  try {
    //if (callback != null) {
      var event_object = platform.events.remote._store[data.event];
      if(event_object != null) {
        delete event_object.attachers[data.attacher+'@'+client.id];
        if (platform.configuration.debug.event === true){
          console.debug('attacher %s detached from unregistered remote event %s at node %s',data.attacher,data.event,client.id);
        }
      }
      //callback();
    //}
  } catch(err) {
    //if (callback != null) {
      //callback(err);
    //} else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught detaching %s from remote event %s at node %s: %s', data.attacher, data.event, client.id, err.message);
      }
    //}
  }
},true);

// registering 'events.attacher.raise' protocol to provide remote object exist check support
platform.cluster.ipc.protocols.register('events.attacher.raise',function(client,data,callback){
  // packet specification
  // {}.event:
  // {}.attacher:
  // {}.args:

  try {
    if (callback != null) {
      var event_object = platform.events.remote._store[data.event];
      if(event_object != null) {
        var attacher = data.attacher+'@'+client.id;
        var attacher_object = event_object.attachers[attacher];
        if (attacher_object != null){
          if (platform.configuration.debug.event === true){
            console.debug('attacher %s raised for remote event %s at node %s',data.attacher,data.event,client.id);
          }
          callback(null,attacher_object.callback.apply(attacher_object,data.args));
        }
      }
      //TODO: i'm not sending error... or do i?
      callback();
    }
  } catch(err) {
    if (callback != null) {
      callback(err);
    } else {
      // logging
      if (platform.configuration.debug.ipc === true) {
        console.warn('exception caught raising attacher %s for remote event %s at node %s: %s', data.attacher, data.event, client.id, err.message);
      }
    }
  }
},true);

platform.events.remote.wait = function(destinations,event,checkCallback,callback){

  callback = native.util.makeHybridCallbackPromise(callback);

  //if (platform.events.exists(event) === true){
    var wait_attacher = 'wait.' + native.uuid.v4();
    //while(platform.events.attachers.exists(event,wait_attacher) === true) {
      //wait_attacher = 'wait.' + native.uuid.v4();
    //}
    var wait_destinations = null;
    platform.events.remote.attach(destinations,event,wait_attacher,function(){
      //TODO: check self (attacher) existance just in case of event looped calls...
      if (checkCallback != null) {
        if (checkCallback.apply(this,arguments) !== true) {
          return;
        }
      }
      platform.events.remote.detach(this.destination,event,wait_attacher);
      if (platform.configuration.debug.event === true){
        console.debug('wait %s for remote event %s resolved at node %s',wait_attacher,event,this.destination);
      }
      if (wait_destinations != null) {
        var wait_destinations_index = wait_destinations.indexOf(this.destination);
        if (wait_destinations_index !== -1) {
          wait_destinations.splice(wait_destinations_index, 1);
        }
        if (wait_destinations.length === 0) {
          if (platform.configuration.debug.event === true){
            console.debug('wait %s for remote event %s resolved',wait_attacher,event);
          }
          callback.resolve();
        }
      }
    }).then(function(success_destinations){
      wait_destinations = success_destinations;
      success_destinations.forEach(function(destination,index){
        if (platform.configuration.debug.event === true){
          console.debug('wait %s for event %s initialized at node %s',wait_attacher,event,destination);
        }
      });
    }).catch(function(failed_destinations){
      failed_destinations.forEach(function(destination,index){
        if (platform.configuration.debug.event === true){
          console.debug('wait %s for event %s not initialized at node %s',wait_attacher,event,destination);
        }
      });
    });
  //} else {
  //  callback.reject(new Exception('event %s does not exist',event));
  //}

  return callback.promise;
};

var Attacher = function(event,name,callback,interval,conservative,filter){
  this.event = event;
  this.name = name;
  this.callback = callback;
  this.enable = true;
  this.sampling = {
    'interval': interval || null,
    'conservative': conservative || false,
    'lease': null,
    'timeout': null
  };
  this.filter = filter || null;
};

var RemoteAttacher = function(event,name,destination,interval,conservative,filter){
  this.event = event;
  this.name = name;
  this.destination = destination;
  this.enable = true;
  this.sampling = {
    'interval': interval || null,
    'conservative': conservative || false,
    'lease': null,
    'timeout': null
  };
  this.filter = filter || null;
};

var RemoteAttacherShadow = function(event,name,destination,callback,interval,conservative,filter){
  this.event = event;
  this.name = name;
  this.destination = destination;
  this.callback = callback;
  this.enable = true;
  this.sampling = {
    'interval': interval || null,
    'conservative': conservative || false,
    'lease': null,
    'timeout': null
  };
  this.filter = filter || null;
};

RemoteAttacher.prototype.callback = function() {
  callback = native.util.makeHybridCallbackPromise(callback);

  platform.cluster.ipc.sendAwait(this.destination,'events.attacher.raise',{
    'event': this.event,
    'attacher': this.name,
    'args': Array.prototype.slice.call(arguments)
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};


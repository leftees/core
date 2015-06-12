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

/**
 * Stores registered event objects.
 * @type {Object}
*/
platform.events._store = platform.events._store || {};

/**
 * Registers a new global event.
 * @param {} event Specifies the name of the event to be registered.
 * @param {} [interval] Specifies the default interval for raise normalization. Default is 0.
 * @param {} [conservative] Specifies the default behavior to keep last raise among ones lost by normalization. Default is false.
 * @param {} [force] Specifies whether to overwrite pre-existent events. Default is false.
*/
platform.events.register = function(event,interval,conservative,force){
  // checking whether an event with same name has been registered
  if (platform.events.exists(event) === false) {
    platform.events._store[event] = new Event(event,interval,conservative);
    if (platform.configuration.debug.event === true){
      console.debug('event %s registered (interval: %s, conservative: %s)',event,(interval)?interval:'none',(conservative)?conservative:false);
    }
  } else if (force === true) {
    //TODO: merge interval and conservative if changed
  } else {
    throw new Exception('event %s already exists',event);
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
      var timeout = event_object.attachers[attacher].sampling.timeout;
      if (timeout != null) {
        clearTimeout(timeout);
        if (platform.configuration.debug.event === true){
          console.debug('attacher %s delayed raise for event %s cleared',attacher,event);
        }
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

/**
 * Raises (emits) an event.
 * @param {} event Specifies the name of the event to be unregistered.
 * @param {} [...] Supports dynamic arguments that will be passed throughout the attachers callbacks.
*/
platform.events.raise = function(event){
  var promises = [];

  // checking if event exists
  if (platform.events.exists(event) === true) {
    if (platform.configuration.debug.event === true) {
      console.debug('event %s raised', event);
    }
    var event_object = platform.events._store[event];
    // checking whether the event has been disabled
    if (event_object.enable === false) {
      if (platform.configuration.debug.event === true) {
        console.debug('raise event %s disabled', event);
      }
      return;
    }
    // preparing data object to apply the filter against ({ arguments[] })
    var data_object = {};
    var now = Date.now();
    data_object.arguments = Array.prototype.slice.call(arguments);
    data_object.arguments.shift();
    // cloning attachers list to allow attacher detact/attach during raise
    var event_attachers = Array.prototype.slice.call(event_object.order);
    // processing attachers stack
    event_attachers.forEach(function (attacher) {
      try {
        var attacher_object = event_object.attachers[attacher];
        // checking whether the attacher has been disabled
        if (attacher_object.enable === false) {
          if (platform.configuration.debug.event === true) {
            console.debug('raise attacher %s for event %s disabled', attacher, event);
          }
          return;
        }
        // applying filter if any
        if (attacher_object.filter != null) {
          if (attacher_object.filter(data_object) !== true) {
            if (platform.configuration.debug.event === true) {
              console.debug('raise attacher %s for event %s skipped by filter', attacher, event);
            }
            return;
          }
        }
        //TODO: propagate attacher raise across cluster nodes
        // validating normalization if any
        var interval = attacher_object.sampling.interval || event_object.sampling.interval;
        var timeout = attacher_object.sampling.timeout || event_object.sampling.timeout;
        if (interval != null && interval > 0) {
          // getting lease from last raise
          var lease = attacher_object.sampling.lease;
          var conservative = attacher_object.sampling.conservative || event_object.sampling.conservative;
          if (lease != null) {
            // if interval is elapsed (we proceed)
            if (now - lease > interval) {
              attacher_object.sampling.lease = now;
            } else {
              // if interval is not elapsed and conservative, we schedule postponed raise through setTimeout
              // (yep, one timeout for every attacher, the old solution was to traverse all events and attachers
              // with an interval but now we're in a single threaded runtime)
              if (conservative === true) {
                // clearing previous timeout if any
                if (timeout != null) {
                  clearTimeout(timeout);
                }
                // creating a new timeout
                attacher_object.sampling.timeout = setTimeout(function () {
                  attacher_object.sampling.timeout = null;
                  if (platform.configuration.debug.event === true) {
                    console.debug('attacher %s delay raised for event %s', attacher, event);
                  }
                  attacher_object.callback.apply(attacher_object, data_object.arguments);
                }, interval - (now - lease));
              }
              // we exit (attacher callback not invoked)
              return;
            }
          } else {
            attacher_object.sampling.lease = now;
          }
        }
        // clearing timeout if any
        if (timeout != null) {
          clearTimeout(timeout);
        }
        if (platform.configuration.debug.event === true) {
          console.debug('attacher %s raised for event %s', attacher, event);
        }
        // invoking callback
        var result = attacher_object.callback.apply(attacher_object, data_object.arguments);
        if (result != null && result.constructor === Promise) {
          promises.push(result);
        }
      } catch (err) {
        if (platform.configuration.debug.event === true) {
          console.warn('exception caught in attacher %s raise for event %s: %s', attacher, event, err.stack);
        }
      }
    });
    if (promises.length > 0) {
      return Promise.all(promises);
    }
    return true;
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Enables a global event.
 * @param {} event Specifies the name of the event to be enabled.
*/
platform.events.enable = function(event){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    platform.events._store[event].enable = true;
    if (platform.configuration.debug.event === true){
      console.debug('event %s enabled',event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Disables a global event.
 * @param {} event Specifies the name of the event to be disabled.
*/
platform.events.disable = function(event){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    platform.events._store[event].enable = false;
    if (platform.configuration.debug.event === true){
      console.debug('event %s disabled',event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Checks whether an global event is registered.
 * @param {} event Specifies the name of the event.
 * @return {} Returns true if the event exists.
*/
platform.events.exists = function(event){
  return (platform.events._store.hasOwnProperty(event));
};

/**
 * Lists the global events registered.
 * @return {} Returns an array of event names.
*/
platform.events.list = function(){
  return Object.keys(platform.events._store);
};

/**
 * Gets a registered event object.
 * @param {} event Specifies the name of the event.
 * @return {} Returns the event object.
*/
platform.events.get = function(event){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    return platform.events._store[event];
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Contains event attachers related methods.
 * @type {Object}
*/
platform.events.attachers = platform.events.attachers || {};

platform.events.attachers._isValidNameRegExp = /^[a-zA-Z][a-zA-Z0-9\.\-]+$/;
platform.events.attachers.isValidName = function(attacher){
  return (platform.events.attachers._isValidNameRegExp.test(attacher) === true && (platform.events.attachers._isValidNameRegExp.lastIndex = 0) === 0);
};

/**
 * Lists attachers of a specific event.
 * @param {} event Specifies the name of the event.
 * @return {} Returns an array of attachers name for the specified event.
*/
platform.events.attachers.list = function(event){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var result = [];
    // adding attacher names to results by order
    platform.events._store[event].order.forEach(function(name){
      result.push(name);
    });
    return result;
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Checks whether an attacher is attached at a specific event.
 * @param {} event Specifies the name of the event.
 * @param {} attacher Specifies the attacher name to check.
 * @return {} Returns true if the attacher is attached to the event.
*/
platform.events.attachers.exists = function(event,attacher){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    return platform.events._store[event].attachers.hasOwnProperty(attacher);
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Enables attacher of an event.
 * @param {} event Specifies the name of the event.
 * @param {} attacher Specifies the attacher name to enable.
*/
platform.events.attachers.enable = function(event,attacher){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    if (event_object.attachers.hasOwnProperty(attacher) === true) {
      event_object.attachers[attacher].enable = true;
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s for event %s enabled',attacher,event);
      }
    } else {
      throw new Exception('attacher %s does not exist for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Disables attacher of an event.
 * @param {} event Specifies the name of the event.
 * @param {} attacher Specifies the attacher name to disable.
*/
platform.events.attachers.disable = function(event,attacher){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    if (event_object.attachers.hasOwnProperty(attacher) === true) {
      event_object.attachers[attacher].enable = false;
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s for event %s disabled',attacher,event);
      }
    } else {
      throw new Exception('attacher %s does not exist for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Gets an attacher object of an event.
 * @param {} event Specifies the name of the event.
 * @param {} attacher Specifies the attacher name to disable.
 * @return {} Returns the attacher object.
*/
platform.events.attachers.get = function(event,attacher){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    return platform.events._store[event].attachers[attacher];
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Gets the index (order) of an attacher within an event.
 * @param {} event Specifies the name of the event.
 * @return {} Returns the index of attacher or -1 if attacher does not exists.
*/
platform.events.attachers.getIndex = function(event,attacher){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    return platform.events._store[event].order.indexOf(attacher);
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Attach a new callback to an event.
 * @param {} event Specifies the name of the event.
*/
platform.events.attach = function(event,attacher,raiseCallback,interval,conservative,filter){
  //TODO: check raiseCallback type
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    // checking whether an existing attacher with same name exists
    if (event_object.attachers.hasOwnProperty(attacher) === false) {
      // compiling filter as json schema v4
      if(filter != null && typeof filter === 'object'){
        filter = native.validator.json(filter);
      } else {
        filter = null;
      }
      // creating new attacher
      event_object.attachers[attacher] = new Attacher(event,attacher,raiseCallback,interval,conservative,filter);
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
 * Attach a new callback to an event before an existing attacher.
 * @param {} event Specifies the name of the event.
*/
platform.events.attachBefore = function(event,attacher,before,raiseCallback,interval,conservative,filter){
  //TODO: check raiseCallback type
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    // checking whether the relative attacher exists (if specified)
    if (before != null && event_object.attachers.hasOwnProperty(before) === false) {
      throw new Exception('attacher %s does not exist for event %s',before,event);
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
      event_object.attachers[attacher] = new Attacher(event,attacher,raiseCallback,interval,conservative,filter);
      // adding attacher to the stack
      if (before == null) {
        event_object.order.unshift(attacher);
      } else {
        event_object.order.splice(event_object.order.indexOf(before),0,attacher);
      }
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s attached to event %s at index %s before %s (interval: %s, conservative: %s, filter: %s)',attacher,event,event_object.order.indexOf(attacher),(before)?before:'all',(interval)?interval:'none',(conservative)?conservative:false,(filter!=null));
      }
    } else {
      throw new Exception('attacher %s already exists for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Attach a new callback to an event after an existing attacher.
 * @param {} event Specifies the name of the event.
*/
platform.events.attachAfter = function(event,attacher,after,raiseCallback,interval,conservative,filter){
  //TODO: check raiseCallback type
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    // checking whether the relative attacher exists (if specified)
    if (after != null && event_object.attachers.hasOwnProperty(after) === false) {
      throw new Exception('attacher %s does not exist for event %s',after,event);
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
      event_object.attachers[attacher] = new Attacher(event,attacher,raiseCallback,interval,conservative,filter);
      // adding attacher to the stack
      if (after == null) {
        event_object.order.push(attacher);
      } else {
        event_object.order.splice(event_object.order.indexOf(after)+1,0,attacher);
      }
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s attached to event %s at index %s after %s (interval: %s, conservative: %s, filter: %s)',attacher,event,event_object.order.indexOf(attacher),(after)?after:'all',(interval)?interval:'none',(conservative)?conservative:false,(filter!=null));
      }
    } else {
      throw new Exception('attacher %s already exists for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Detach an existing attacher from an event.
 * @param {} event Specifies the name of the event.
*/
platform.events.detach = function(event,attacher){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    if (event_object.attachers.hasOwnProperty(attacher) === true) {
      // clearing attacher timeout if any
      var timeout = event_object.attachers[attacher].sampling.timeout;
      if (timeout != null) {
        clearTimeout(timeout);
        if (platform.configuration.debug.event === true){
          console.debug('attacher %s delayed raise for event %s cleared',attacher,event);
        }
      }
      // removing attacher from stack
      event_object.order.splice(event_object.order.indexOf(attacher),1);
      // deleting event object
      delete event_object.attachers[attacher];
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s detached from event %s',attacher,event);
      }
    } else {
      throw new Exception('attacher %s does not exist for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Moves an existing attacher before another one.
 * @param {} event Specifies the name of the event.
 * @param {} attacher Specifies the name of the attacher to move.
 * @param {} [before] Specifies the name of the attacher that will be the next sibling. If missing the attacher will be promoted to the top (index = 0).
*/
platform.events.moveBefore = function(event,attacher,before){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    // checking whether the relative attacher exists (if specified)
    if (before != null && event_object.attachers.hasOwnProperty(before) === false) {
      throw new Exception('attacher %s does not exist for event %s',before,event);
    }
    // detecting position of attacher to move
    if (event_object.attachers.hasOwnProperty(attacher) === true) {
      // extracting attacher from stack
      event_object.order.splice(event_object.order.indexOf(attacher),1);
      // moving at index 0 if 'after' is not specified
      if (before == null) {
        event_object.order.unshift(attacher);
      } else {
        event_object.order.splice(event_object.order.indexOf(before),0,attacher);
      }
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s for event %s moved to index %s before %s',attacher,event,event_object.order.indexOf(attacher),(before)?before:'all');
      }
    } else {
      throw new Exception('attacher %s does not exist for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

/**
 * Moves an existing attacher after another one.
 * @param {} event Specifies the name of the event.
 * @param {} attacher Specifies the name of the attacher to move.
 * @param {} [after] Specifies the name of the attacher that will be the previous sibling. If missing the attacher will be promoted to the bottom.
*/
platform.events.moveAfter = function(event,attacher,after){
  // checking if event exists
  if (platform.events.exists(event) === true) {
    var event_object = platform.events._store[event];
    // checking whether the relative attacher exists (if specified)
    if (after != null && event_object.attachers.hasOwnProperty(after) === false) {
      throw new Exception('attacher %s does not exist for event %s',after,event);
    }
    // detecting position of attacher to move
    if (event_object.attachers.hasOwnProperty(attacher) === true) {
      // extracting attacher from stack
      event_object.order.splice(event_object.order.indexOf(attacher),1);
      // moving at latest index if 'after' is not specified
      if (after == null) {
        event_object.order.push(attacher);
      } else {
        event_object.order.splice(event_object.order.indexOf(after)+1,0,attacher);
      }
      if (platform.configuration.debug.event === true){
        console.debug('attacher %s for event %s moved to index %s after %s',attacher,event,event_object.order.indexOf(attacher),(after)?after:'all');
      }
    } else {
      throw new Exception('attacher %s does not exist for event %s',attacher,event);
    }
  } else {
    throw new Exception('event %s does not exist',event);
  }
};

platform.events.wait = function(event,checkCallback,callback){
  callback = native.util.makeHybridCallbackPromise(callback);

  if (platform.events.exists(event) === true){
    var wait_attacher = 'wait.' + native.uuid.v4();
    while(platform.events.attachers.exists(event,wait_attacher) === true) {
      wait_attacher = 'wait.' + native.uuid.v4();
    }
    platform.events.attach(event,wait_attacher,function(){
      //TODO: check self (attacher) existance just in case of event looped calls...
      if (checkCallback != null) {
        if (checkCallback.apply(this,arguments) !== true) {
          return;
        }
      }
      platform.events.detach(event,wait_attacher);
      if (platform.configuration.debug.event === true){
        console.debug('wait %s for event %s resolved',wait_attacher,event);
      }
      callback.resolve();
    });
    if (platform.configuration.debug.event === true){
      console.debug('wait %s for event %s initialized',wait_attacher,event);
    }
  } else {
    callback.reject(new Exception('event %s does not exist',event));
  }

  return callback.promise;
};

var Event = function(name,interval,conservative){
  this.name = name;
  this.attachers = {};
  this.order = [];
  this.enable = true;
  this.sampling = {
    'interval': interval || null,
    'conservative': conservative || false
  };
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

platform.events.register('core.init',null,null,true);
platform.events.register('core.ready',null,null,true);
platform.events.register('application.ready',null,null,true);

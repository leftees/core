platform.x = function(destinations,optional,callback){
  // normalizing arguments
  if (callback == null && typeof optional === 'function'){
    callback = optional;
    optional = null;
  }
  //TODO: serialize args?
  callback = native.util.makeHybridCallbackPromise(callback);

  //TODO: serialize args?
  platform.cluster.ipc.sendAwait(destinations,'protocol.x',{
    'x': optional
  }).then(callback.resolve,callback.reject);

  return callback.promise;
};

platform.cluster.ipc.protocols.register('protocol.x',function(client,data,callback){
  // packet specification
  // {}.x: optional value

  try {
    if (callback != null) {
      //TODO: we're in duplex mode
    } else {
      //TODO: we're in broadcast mode
    }
  } catch(error) {
    if (callback != null) {
      callback(err);
    } else {
      throw error
    }
  }
},true);

platform.cluster.ipc.protocols.register('protocol.sync', function(client,data){
  // packet specification
  // {}.x: optional value

  //throw new Error();

  //do();

},true);

platform.cluster.ipc.protocols.register('protocol.promise', function(client,data){
  // packet specification
  // {}.x: optional value

  //throw new Error();

  //do();

  return new Promise(function(resolve,reject){

  });

},true);

platform.cluster.ipc.protocols.register('protocol.async', async function(client,data){
  // packet specification
  // {}.x: optional value

  //throw new Error();

  //do();

  //await do();

},true);

platform.cluster.ipc.protocols.register('protocol.duplex',function(client,data,callback){
  // packet specification
  // {}.x: optional value

  try {
    if (callback != null) {
      //TODO: we're in duplex mode
    } else {
      //TODO: we're in broadcast mode
    }
  } catch(error) {
    if (callback != null) {
      callback(err);
    } else {
      throw error
    }
  }
},true);

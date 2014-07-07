'use strict';
var inspector = new (require('./lib/debug-server').DebugServer)();
inspector.on('error', function(err) {
  console.error(
    'Cannot start the server at %s:%s. Error: %s.',
      config.webHost || '0.0.0.0',
      config.webPort,
      err.message || err
  );

});
inspector.on('listening', function() {
  var address = this.address();
  console.log('debugger front-end listening on port %s', address.port);
});
inspector.on('close', function () {
  process.exit();
});

inspector.start({
  "webPort": 9092,
  "webHost": "0.0.0.0",
  "debugPort": 5858,
  "saveLiveEdit": false,
  "hidden": [],
  "preload": false,
  "stackTraceLimit": 50
});
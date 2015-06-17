var DebuggerClient = require('v8-debug-protocol');

var ports = process.argv.slice(2);
var debug_continue = function(port){
  try {
    var client = new DebuggerClient(port);
    client.on('connect', function () {
      client.continue(function (error, done) {
        if (done === true){
          ports.splice(ports.indexOf(port),1);
        }
      });
    });
  } catch(error) {
  }
};

console.log('resuming');
setInterval(function(){
  ports.forEach(function(port){
    debug_continue(port);
  });
  if (ports.length === 0){
    process.exit(0);
  }
}, 500);


#!/bin/bash
function stop_on_error { if [ $1 != 0 ]; then read a; fi; }
node main.server.js _.clean
stop_on_error $?
node main.server.js _.build.core
stop_on_error $?
node main.server.js _.dist.core
stop_on_error $?
node main.server.js _.build.cluster
stop_on_error $?
node main.server.js _.dist.cluster
stop_on_error $?
echo ""
echo "remember to package.json and publish"
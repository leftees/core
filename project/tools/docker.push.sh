#!/bin/bash
ubuntu=`docker run -t --entrypoint="bash"  ljveio/core:latest -c "lsb_release -sr"`
ubuntu=${ubuntu::-1}
node=`docker run -t --entrypoint="bash"  ljveio/core:latest -c "node -v"`
node=${node:1:-1}
ljve=`docker run -t --entrypoint="bash"  ljveio/core:latest -c "npm -g view ljve.io version"`
ljve=${ljve::-1}
tag=$ubuntu-$node-$ljve
echo $tag
docker tag -f ljveio/core:latest ljveio/core:$tag
docker push ljveio/core:latest
docker push ljveio/core:$tag
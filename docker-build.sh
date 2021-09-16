#!/bin/bash

export NODE_VERSION=14.17.6
export BRANCH=${BRANCH=local}

docker build --build-arg NODE_VERSION . -t event-dashboard-stats-server:${BRANCH}

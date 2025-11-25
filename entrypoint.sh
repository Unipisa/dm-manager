#!/usr/bin/env bash

set -e

if [ $# -eq 0 ]; then
    echo "entrypoint: no command specified"
    exit 1
fi

if [ $1 = "server" ]; then
    shift
    echo "entrypoint: starting server"
    mkdir -p /logs/
    mkdir -p /uploads
    mkdir -p /uploads/private

    node /app/server/run-server.js
    exit 0
fi

if [ $1 = "worker" ]; then
    shift
    echo "entrypoint: starting worker"
    node /app/server/worker.js
    exit 0
fi

echo "entrypoint: unknown command '$1'"



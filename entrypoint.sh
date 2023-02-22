#!/usr/bin/env bash

set -e

echo "ENTRYPOINT"
mkdir -p /logs/
mkdir -p /app/uploads

node /app/server/server.js | tee --append /logs/log




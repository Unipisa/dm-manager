#!/usr/bin/env bash

set -e

echo "ENTRYPOINT"
mkdir -p /logs/
node /app/server/server.js | tee --append /logs/log




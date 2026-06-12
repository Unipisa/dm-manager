#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mongo_started=false

mongo_available() {
  timeout 1 bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/27017' 2>/dev/null
}

wait_for_mongo() {
  for _ in {1..30}; do
    if mongo_available; then
      return 0
    fi

    sleep 1
  done

  return 1
}

if mongo_available; then
  echo "MongoDB is already available on localhost:27017."
else
  echo "MongoDB is not available on localhost:27017; starting it with docker compose."
  docker compose up -d mongodb
  mongo_started=true
  echo "MongoDB container started; waiting for it to accept connections."

  if wait_for_mongo; then
    echo "MongoDB is available on localhost:27017."
  else
    echo "MongoDB did not become available on localhost:27017." >&2
    exit 1
  fi
fi

if [[ ! -d "$ROOT_DIR/server/node_modules" || ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  cat >&2 <<EOF
Missing dependencies.

Run these once, then start dev again:
  npm --prefix server ci
  npm --prefix frontend ci
EOF
  exit 1
fi

pids=()

cleanup() {
  local status=$?

  trap - INT TERM EXIT

  if ((${#pids[@]} > 0)); then
    kill "${pids[@]}" 2>/dev/null || true
    wait "${pids[@]}" 2>/dev/null || true
  fi

  if [[ "$mongo_started" == true ]]; then
    echo "MongoDB was started by this script and is still running."
    echo "Stop it with: docker compose stop mongodb"
  fi

  exit "$status"
}

trap cleanup INT TERM EXIT

echo "Starting backend on http://localhost:8000"
echo "Starting frontend on http://localhost:3000"
echo "Press Ctrl-C to stop both."

npm --prefix "$ROOT_DIR/server" start &
pids+=("$!")

npm --prefix "$ROOT_DIR/frontend" start &
pids+=("$!")

wait -n "${pids[@]}"

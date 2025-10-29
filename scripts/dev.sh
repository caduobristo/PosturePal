#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

log() {
  echo "[dev] $*"
}

REQUIRED_COMMANDS=(docker python3 npm npx)
for cmd in "${REQUIRED_COMMANDS[@]}"; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Error: ${cmd} is required but was not found in PATH." >&2
    exit 1
  fi
done

MONGO_CONTAINER="posturepal-mongo"
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  if docker ps -a --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
    log "Starting existing Mongo container (${MONGO_CONTAINER})..."
    docker start "${MONGO_CONTAINER}" >/dev/null
  else
    log "Creating Mongo container (${MONGO_CONTAINER})..."
    docker run -d --name "${MONGO_CONTAINER}" -p 27017:27017 mongo:7 >/dev/null
  fi
else
  log "Mongo container already running."
fi

if [ ! -d ".venv" ]; then
  log "Creating Python virtual environment..."
  python3 -m venv .venv
fi

log "Installing backend dependencies..."
"${PROJECT_ROOT}/.venv/bin/pip" install -r app/backend/requirements.txt >/dev/null

log "Installing frontend dependencies..."
pushd app/frontend >/dev/null
npm install >/dev/null
popd >/dev/null

export REACT_APP_API_URL="${REACT_APP_API_URL:-http://localhost:8000/api}"

log "Starting backend and frontend..."
npx concurrently --kill-others --names "backend,frontend" --prefix-colors "red,blue" \
  "bash -lc 'cd \"${PROJECT_ROOT}/app/backend\" && \"${PROJECT_ROOT}/.venv/bin/uvicorn\" server:app --reload --host 0.0.0.0 --port 8000'" \
  "bash -lc 'cd \"${PROJECT_ROOT}/app/frontend\" && npm start'"

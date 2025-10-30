#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

log() {
  echo "[dev] $*"
}

REQUIRED_COMMANDS=(python3 npm npx)
for cmd in "${REQUIRED_COMMANDS[@]}"; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Error: ${cmd} is required but was not found in PATH." >&2
    exit 1
  fi
done

if [ ! -d ".venv" ]; then
  log "Creating Python virtual environment..."
  python3 -m venv .venv
fi

log "Installing frontend dependencies..."
pushd app/frontend >/dev/null
npm install >/dev/null
popd >/dev/null
export REACT_APP_API_URL="${REACT_APP_API_URL:-http://localhost:3000}"

log "Starting frontend (no Docker/Mongo will be created)."
pushd app/frontend >/dev/null
npm start
popd >/dev/null

#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PRUNE="${REPO_ROOT}/jenkins/docker-prune.sh"

cd "$REPO_ROOT"

_prune_on_exit() {
  if [ -x "$PRUNE" ]; then
    bash "$PRUNE" || true
  fi
}
trap _prune_on_exit EXIT

git fetch origin master
git reset --hard origin/master

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-0}"

docker rm -f etl-frontend-container 2>/dev/null || true

docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build --force-recreate --remove-orphans

curl -sf "http://${DEPLOY_HOST:-127.0.0.1}:3000" >/dev/null

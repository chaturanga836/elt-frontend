#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PRUNE="${REPO_ROOT}/jenkins/docker-prune.sh"

cd "$REPO_ROOT"

# Jenkins-in-Docker: host daemon cannot see /var/jenkins_home/workspace bind mounts.
if [ -n "${BUILD_NUMBER:-}" ]; then
  exec bash "${REPO_ROOT}/jenkins/deploy-docker.sh"
fi

# shellcheck source=jenkins/compose.sh
source "${REPO_ROOT}/jenkins/compose.sh"

_prune_on_exit() {
  if [ -x "$PRUNE" ]; then
    bash "$PRUNE" || true
  fi
}
trap _prune_on_exit EXIT

# Jenkins already checked out the commit; git fetch needs credentials in CI.
if [ -z "${BUILD_NUMBER:-}" ]; then
  git fetch origin master
  git reset --hard origin/master
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-0}"

bash scripts/generate-self-signed-cert.sh

# shellcheck source=jenkins/free-edge-ports.sh
source "${REPO_ROOT}/jenkins/free-edge-ports.sh"

compose down --remove-orphans 2>/dev/null || compose down 2>/dev/null || true
docker rm -f etl-frontend-container etl-frontend elt-frontend-proxy 2>/dev/null || true
release_edge_ports

compose up -d --build --force-recreate

curl -kfs "https://${DEPLOY_HOST:-127.0.0.1}/" >/dev/null

#!/bin/bash
# Deploy from Jenkins when the workspace lives inside the Jenkins container.
# The host Docker daemon cannot bind-mount /var/jenkins_home/workspace paths
# (same constraint as jenkins/run-tests.sh).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_CLI_IMAGE="${DOCKER_COMPOSE_CLI_IMAGE:-docker:27-cli}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-etl-frontend}"
VOL="etl-frontend-jenkins-src-${BUILD_NUMBER:-0}-${RANDOM}"

cleanup_vol() {
  docker volume rm -f "$VOL" >/dev/null 2>&1 || true
}

compose_in_volume() {
  local -a env_args=(-e "COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}")
  for key in DOCKER_BUILDKIT NEXT_PUBLIC_BUILD_ID NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_KC_URL NEXT_PUBLIC_KC_REALM NEXT_PUBLIC_KC_CLIENT_ID; do
    if [ -n "${!key:-}" ]; then
      env_args+=(-e "${key}=${!key}")
    fi
  done

  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "${VOL}:/app" \
    -w /app \
    "${env_args[@]}" \
    "$COMPOSE_CLI_IMAGE" \
    sh -ec 'apk add --no-cache docker-cli-compose >/dev/null && exec docker compose "$@"' sh "$@"
}

echo "=== Creating deploy volume ${VOL} ==="
docker volume create "$VOL" >/dev/null
trap cleanup_vol EXIT

echo "=== Copying workspace into volume ==="
tar cf - \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  . | docker run --rm -i \
  -v "${VOL}:/out" \
  alpine sh -c 'rm -rf /out/* /out/.[!.]* 2>/dev/null || true; tar xf - -C /out'

if [ ! -f .env ]; then
  echo "ERROR: .env missing — run Prepare Environment first" >&2
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-0}"

echo "=== Removing legacy containers ==="
docker rm -f etl-frontend-container etl-frontend 2>/dev/null || true

echo "=== Stopping previous compose stack ==="
compose_in_volume down --remove-orphans 2>/dev/null || compose_in_volume down 2>/dev/null || true

echo "=== Building and starting frontend (compose) ==="
compose_in_volume up -d --build --force-recreate

echo "=== Waiting for health ==="
for i in $(seq 1 24); do
  if curl -sf "http://${DEPLOY_HOST:-127.0.0.1}:3000"; then
    echo "Frontend OK"
    trap - EXIT
    cleanup_vol
    exit 0
  fi
  if [ "$i" -eq 24 ]; then
    echo "ERROR: Frontend health check failed after compose up" >&2
    docker logs etl-frontend --tail 80 2>/dev/null || true
    exit 1
  fi
  sleep 5
done

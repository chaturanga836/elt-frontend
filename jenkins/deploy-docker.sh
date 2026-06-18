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

# Compose bind mounts must use paths the *host* daemon can read. Mounting the
# deploy volume at /app inside the CLI container makes compose pass /app/nginx/...
# to the daemon, which does not exist on the host (Docker may create directories
# there and break the next deploy). Use the volume's host mountpoint instead.
vol_host_path() {
  docker volume inspect -f '{{ .Mountpoint }}' "$VOL"
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
    -v "${VOL_PATH}:${VOL_PATH}" \
    -w "${VOL_PATH}" \
    "${env_args[@]}" \
    "$COMPOSE_CLI_IMAGE" \
    sh -ec 'apk add --no-cache docker-cli-compose >/dev/null && exec docker compose "$@"' sh "$@"
}

echo "=== Cleaning stale host bind-mount paths (Jenkins-in-Docker) ==="
for stale in /app/nginx/default.conf /app/nginx/ssl.conf; do
  if [ -d "$stale" ]; then
    echo "Removing erroneous directory ${stale}"
    rm -rf "$stale"
  fi
done

echo "=== Creating deploy volume ${VOL} ==="
docker volume create "$VOL" >/dev/null
VOL_PATH="$(vol_host_path)"
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

# shellcheck source=jenkins/free-edge-ports.sh
source "${ROOT}/jenkins/free-edge-ports.sh"

echo "=== Ensuring TLS certificates in deploy volume ==="
docker run --rm \
  -v "${VOL_PATH}:${VOL_PATH}" \
  -w "${VOL_PATH}" \
  -e "DEPLOY_HOST=${DEPLOY_HOST:-13.200.160.10}" \
  alpine sh -ec 'apk add --no-cache openssl bash >/dev/null && bash scripts/generate-self-signed-cert.sh'

echo "=== Stopping previous compose stack ==="
compose_in_volume down --remove-orphans 2>/dev/null || compose_in_volume down 2>/dev/null || true

echo "=== Removing legacy containers ==="
docker rm -f etl-frontend-container etl-frontend elt-frontend-proxy 2>/dev/null || true

release_edge_ports

echo "=== Building and starting frontend (compose) ==="
compose_in_volume up -d --build --force-recreate

echo "=== Waiting for health ==="
for i in $(seq 1 24); do
  if curl -kfs "https://${DEPLOY_HOST:-127.0.0.1}/"; then
    echo "Frontend OK"
    trap - EXIT
    cleanup_vol
    exit 0
  fi
  if [ "$i" -eq 24 ]; then
    echo "ERROR: Frontend health check failed after compose up" >&2
    docker logs etl-frontend --tail 80 2>/dev/null || true
    docker logs elt-frontend-proxy --tail 80 2>/dev/null || true
    exit 1
  fi
  sleep 5
done

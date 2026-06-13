#!/bin/bash
# Run npm ci, lint, and build inside Docker without bind-mounting the workspace.
# Required when Jenkins has no Node/npm on the agent (or runs in Docker where
# host workspace paths are not visible to the docker daemon).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f package.json ]; then
  echo "ERROR: package.json not found in ${ROOT}"
  ls -la
  exit 1
fi

: "${NEXT_PUBLIC_API_URL:=http://13.200.160.10:8000/api/v1}"
: "${NEXT_PUBLIC_KC_URL:=http://13.200.160.10:8081}"
: "${NEXT_PUBLIC_KC_REALM:=workspace-realm}"
: "${NEXT_PUBLIC_KC_CLIENT_ID:=workspace-web}"
: "${NEXT_PUBLIC_BUILD_ID:=ci}"

tar cf - \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  . | docker run --rm -i -w /app \
  -e NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  -e NEXT_PUBLIC_KC_URL="${NEXT_PUBLIC_KC_URL}" \
  -e NEXT_PUBLIC_KC_REALM="${NEXT_PUBLIC_KC_REALM}" \
  -e NEXT_PUBLIC_KC_CLIENT_ID="${NEXT_PUBLIC_KC_CLIENT_ID}" \
  -e NEXT_PUBLIC_BUILD_ID="${NEXT_PUBLIC_BUILD_ID}" \
  node:22.13.1-alpine sh -lc '
    set -e
    tar xf -
    apk add --no-cache libc6-compat >/dev/null
    npm ci --legacy-peer-deps
    npm run lint:ci
    npm run build
  '

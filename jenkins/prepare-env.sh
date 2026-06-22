#!/bin/bash
# Writes .env for production deploy. Called from Jenkinsfile (Prepare Environment).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${DEPLOY_HOST:=dtorch.online}"
: "${NEXT_PUBLIC_API_URL:=https://${DEPLOY_HOST}/api/v1}"
: "${NEXT_PUBLIC_KC_URL:=https://${DEPLOY_HOST}}"
: "${NEXT_PUBLIC_KC_REALM:=workspace-realm}"
: "${NEXT_PUBLIC_KC_CLIENT_ID:=workspace-web}"
: "${NEXT_PUBLIC_BUILD_ID:=${BUILD_NUMBER:-production}}"
: "${DOCKER_BUILDKIT:=0}"

cat > .env <<EOF
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
NEXT_PUBLIC_KC_URL=${NEXT_PUBLIC_KC_URL}
NEXT_PUBLIC_KC_REALM=${NEXT_PUBLIC_KC_REALM}
NEXT_PUBLIC_KC_CLIENT_ID=${NEXT_PUBLIC_KC_CLIENT_ID}
NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}
DEPLOY_HOST=${DEPLOY_HOST}
DOCKER_BUILDKIT=${DOCKER_BUILDKIT}
EOF

echo "Wrote .env (API=${NEXT_PUBLIC_API_URL}, KC=${NEXT_PUBLIC_KC_URL}, BUILD_ID=${NEXT_PUBLIC_BUILD_ID})"

#!/usr/bin/env bash
# Ensure TLS material exists on persistent host paths (survives Jenkins redeploys).
# Generates self-signed certs only when no real/Let's Encrypt certs are present.

set -euo pipefail

CERT_DIR="${ELT_NGINX_CERT_DIR:-/opt/elt-nginx/certs}"
ACME_DIR="${ELT_NGINX_ACME_DIR:-/opt/elt-nginx/acme}"

ensure_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    return 0
  fi
  if mkdir -p "$dir" 2>/dev/null; then
    return 0
  fi
  sudo mkdir -p "$dir"
}

ensure_dir "$CERT_DIR"
ensure_dir "$ACME_DIR"
ensure_dir "$ACME_DIR/.well-known/acme-challenge"

if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
  echo "TLS certs already present in ${CERT_DIR} — skipping generation"
  exit 0
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export CERT_DIR
bash "${ROOT}/scripts/generate-self-signed-cert.sh"

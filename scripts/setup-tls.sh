#!/usr/bin/env bash
# Obtain a Let's Encrypt certificate and install it on persistent host paths.
#
# One-time setup on the EC2 host (as root):
#   sudo bash scripts/setup-tls.sh dtorch.online www.dtorch.online
#
# Prerequisites:
#   - DNS A record points to this server
#   - Security group allows inbound TCP 80 and 443

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash scripts/setup-tls.sh <domain> [extra-domain ...]" >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

PRIMARY_DOMAIN="$1"
shift
EXTRA_DOMAINS=("$@")
CERT_DIR="${ELT_NGINX_CERT_DIR:-/opt/elt-nginx/certs}"
ACME_DIR="${ELT_NGINX_ACME_DIR:-/opt/elt-nginx/acme}"

mkdir -p "$CERT_DIR" "$ACME_DIR/.well-known/acme-challenge"

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  apt-get install -y certbot
fi

CERTBOT_ARGS=(-d "$PRIMARY_DOMAIN")
for domain in "${EXTRA_DOMAINS[@]}"; do
  CERTBOT_ARGS+=(-d "$domain")
done

echo "Requesting certificate for: ${PRIMARY_DOMAIN} ${EXTRA_DOMAINS[*]}"

PROXY_WAS_RUNNING=0
if docker ps --format '{{.Names}}' | grep -qx 'elt-frontend-proxy'; then
  PROXY_WAS_RUNNING=1
fi

issue_with_webroot() {
  certbot certonly --webroot \
    -w "$ACME_DIR" \
    "${CERTBOT_ARGS[@]}" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email
}

issue_with_standalone() {
  docker stop elt-frontend-proxy 2>/dev/null || true
  certbot certonly --standalone \
    "${CERTBOT_ARGS[@]}" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email
}

if ! issue_with_webroot; then
  echo "Webroot challenge failed — retrying with standalone (port 80)..."
  issue_with_standalone
fi

if [[ "$PROXY_WAS_RUNNING" -eq 1 ]]; then
  docker start elt-frontend-proxy 2>/dev/null || true
fi

install_certs() {
  cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
  cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem" "${CERT_DIR}/privkey.pem"
  chmod 644 "${CERT_DIR}/fullchain.pem"
  chmod 600 "${CERT_DIR}/privkey.pem"
}

install_certs

HOOK_DIR=/etc/letsencrypt/renewal-hooks/deploy
mkdir -p "$HOOK_DIR"
cat >"${HOOK_DIR}/elt-frontend-proxy-reload.sh" <<EOF
#!/bin/sh
CERT_DIR="${CERT_DIR}"
cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem" "\${CERT_DIR}/fullchain.pem"
cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem" "\${CERT_DIR}/privkey.pem"
chmod 644 "\${CERT_DIR}/fullchain.pem"
chmod 600 "\${CERT_DIR}/privkey.pem"
docker exec elt-frontend-proxy nginx -s reload 2>/dev/null || true
EOF
chmod +x "${HOOK_DIR}/elt-frontend-proxy-reload.sh"

if docker ps --format '{{.Names}}' | grep -qx 'elt-frontend-proxy'; then
  echo "Reloading nginx proxy..."
  docker exec elt-frontend-proxy nginx -s reload
fi

echo ""
echo "TLS installed in ${CERT_DIR} (persists across Jenkins deploys)."
echo "  https://${PRIMARY_DOMAIN}"
echo ""
echo "Redeploy elt-frontend via Jenkins to pick up compose mount changes if needed."

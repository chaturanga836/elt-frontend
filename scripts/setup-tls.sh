#!/usr/bin/env bash
# Obtain a Let's Encrypt certificate and enable trusted HTTPS on elt-frontend-proxy.
#
# Run on the EC2 host from the elt-frontend deploy directory (where docker-compose.yml lives):
#   sudo bash scripts/setup-tls.sh dtorch.online
#   sudo bash scripts/setup-tls.sh dtorch.online www.dtorch.online
#
# Prerequisites:
#   - DNS A record for the domain points to this server's public IP
#   - Security group allows inbound TCP 80 and 443
#   - elt-frontend-proxy is running (docker compose up -d)

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash scripts/setup-tls.sh <domain> [extra-domain ...]" >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRIMARY_DOMAIN="$1"
shift
EXTRA_DOMAINS=("$@")
WEBROOT="${ROOT}/nginx/acme"
CERT_DIR="${ROOT}/nginx/certs"

mkdir -p "$WEBROOT" "$CERT_DIR"

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  apt-get install -y certbot
fi

CERTBOT_ARGS=(-d "$PRIMARY_DOMAIN")
for domain in "${EXTRA_DOMAINS[@]}"; do
  CERTBOT_ARGS+=(-d "$domain")
done

echo "Requesting certificate for: ${PRIMARY_DOMAIN} ${EXTRA_DOMAINS[*]}"

certbot certonly --webroot \
  -w "$WEBROOT" \
  "${CERTBOT_ARGS[@]}" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email

cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem" "${CERT_DIR}/privkey.pem"
chmod 644 "${CERT_DIR}/fullchain.pem"
chmod 600 "${CERT_DIR}/privkey.pem"

HOOK_DIR=/etc/letsencrypt/renewal-hooks/deploy
mkdir -p "$HOOK_DIR"
cat >"${HOOK_DIR}/elt-frontend-proxy-reload.sh" <<EOF
#!/bin/sh
cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
cp "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem" "${CERT_DIR}/privkey.pem"
chmod 644 "${CERT_DIR}/fullchain.pem"
chmod 600 "${CERT_DIR}/privkey.pem"
docker exec elt-frontend-proxy nginx -s reload 2>/dev/null || true
EOF
chmod +x "${HOOK_DIR}/elt-frontend-proxy-reload.sh"

echo "Reloading nginx proxy..."
docker exec elt-frontend-proxy nginx -s reload

echo ""
echo "TLS enabled for ${PRIMARY_DOMAIN}."
echo "  https://${PRIMARY_DOMAIN}"
echo ""
echo "Next steps:"
echo "  1. Update Jenkins DEPLOY_HOST / NEXT_PUBLIC_* to ${PRIMARY_DOMAIN}"
echo "  2. Redeploy etl-back (CORS, FRONTEND_URL, GitHub callback)"
echo "  3. Redeploy elt-frontend (rebuild with new NEXT_PUBLIC_* URLs)"
echo "  4. Update Keycloak workspace-web redirect URIs to https://${PRIMARY_DOMAIN}/*"

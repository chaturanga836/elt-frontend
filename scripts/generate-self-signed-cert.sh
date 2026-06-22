#!/bin/bash
# Generate a self-signed TLS certificate for nginx until a real domain + Let's Encrypt cert is available.
# Usage: DEPLOY_HOST=13.200.160.10 bash scripts/generate-self-signed-cert.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="${CERT_DIR:-${ELT_NGINX_CERT_DIR:-${ROOT}/nginx/certs}}"
HOST="${DEPLOY_HOST:-13.200.160.10}"
DAYS="${CERT_DAYS:-825}"

mkdir -p "${CERT_DIR}"

if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
  echo "TLS certs already exist in ${CERT_DIR} — skipping generation"
  exit 0
fi

OPENSSL_CONFIG="$(mktemp)"
trap 'rm -f "${OPENSSL_CONFIG}"' EXIT

cat > "${OPENSSL_CONFIG}" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = ${HOST}

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${HOST}
DNS.1 = ${HOST}
EOF

openssl req -x509 -nodes -days "${DAYS}" -newkey rsa:2048 \
  -keyout "${CERT_DIR}/privkey.pem" \
  -out "${CERT_DIR}/fullchain.pem" \
  -config "${OPENSSL_CONFIG}"

chmod 644 "${CERT_DIR}/fullchain.pem"
chmod 600 "${CERT_DIR}/privkey.pem"

echo "Generated self-signed cert for ${HOST} in ${CERT_DIR}"
echo "Browsers will show a warning until you replace these with Let's Encrypt certificates."

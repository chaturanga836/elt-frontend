# Jenkins Pipeline job — elt-frontend

Deploy the Next.js UI via `docker-compose.yml` behind an **nginx TLS reverse proxy** on ports **80/443**. Next.js listens on **3000** inside Docker only; users access `https://${DEPLOY_HOST}/`.

Production `.env` is generated in **Prepare Environment** (same pattern as the legacy inline Jenkins script).

## Configuration

| Setting | Value |
|---------|-------|
| **Definition** | Pipeline script from SCM |
| **SCM** | Git — `elt-frontend` |
| **Branch** | `*/master` |
| **Script Path** | `Jenkinsfile` |

## URLs (Jenkinsfile `environment` block)

| Variable | Default |
|----------|---------|
| `DEPLOY_HOST` | `dtorch.online` |
| `NEXT_PUBLIC_API_URL` | `https://dtorch.online/api/v1` |
| `NEXT_PUBLIC_KC_URL` | `https://dtorch.online` |
| `NEXT_PUBLIC_KC_REALM` | `workspace-realm` |
| `NEXT_PUBLIC_KC_CLIENT_ID` | `workspace-web` |
| `DOCKER_BUILDKIT` | `0` |

`NEXT_PUBLIC_BUILD_ID` is set to `BUILD_NUMBER` in [`prepare-env.sh`](prepare-env.sh).

No Jenkins credentials required for frontend (public build-time URLs only).

nginx proxies browser traffic on the same HTTPS origin:

| Path | Upstream (internal) |
|------|---------------------|
| `/` | `frontend:3000` |
| `/api/` | `host.docker.internal:8000` |
| `/realms/`, `/resources/` | `host.docker.internal:8081` (Keycloak) |

## TLS certificates (persistent host paths)

Certs live on the **EC2 host**, not in the ephemeral Jenkins deploy volume:

| Host path | Purpose |
|-----------|---------|
| `/opt/elt-nginx/certs` | `fullchain.pem` + `privkey.pem` mounted into `elt-frontend-proxy` |
| `/opt/elt-nginx/acme` | Let's Encrypt HTTP-01 webroot |

[`deploy-docker.sh`](deploy-docker.sh) runs [`scripts/ensure-tls-certs.sh`](../scripts/ensure-tls-certs.sh) before each deploy. It **skips** generation when real certs already exist in `/opt/elt-nginx/certs`.

### One-time server setup

```bash
# On EC2 (once) — create dirs and issue Let's Encrypt cert
sudo mkdir -p /opt/elt-nginx/certs /opt/elt-nginx/acme
sudo bash scripts/setup-tls.sh dtorch.online www.dtorch.online
```

`setup-tls.sh` installs a renewal hook that copies renewed certs to `/opt/elt-nginx/certs` and reloads nginx.

Until Let's Encrypt is configured, the first Jenkins deploy generates a **self-signed** cert in `/opt/elt-nginx/certs` (browsers will warn).

Override paths with `ELT_NGINX_CERT_DIR` / `ELT_NGINX_ACME_DIR` if needed.

## Keycloak client (`workspace-web`)

Update redirect URIs in the Keycloak admin console (**Clients → workspace-web → Valid redirect URIs**):

- `https://dtorch.online/auth/callback`
- `https://dtorch.online/login`
- `https://dtorch.online/*`

Also add **Web origins**: `https://dtorch.online`

## Pipeline stages

1. **Test** — all branches: [`run-tests.sh`](run-tests.sh) (`npm ci`, lint, build in `node:22.13.1-alpine`)
2. **Prepare Environment** — `master` only: [`prepare-env.sh`](prepare-env.sh) → writes `.env`
3. **Deploy** — `master` only: [`deploy.sh`](../deploy.sh) → [`deploy-docker.sh`](deploy-docker.sh) in CI (workspace copied into a Docker volume; host daemon cannot bind-mount Jenkins workspace paths)
4. **Health** — `master` only: `curl -fs https://${DEPLOY_HOST}/` (falls back to `-k` for self-signed)

## Deploy ordering

1. Deploy **etl-back** first (CORS + `FRONTEND_URL=https://...`).
2. Update Keycloak client redirect URIs (above).
3. Deploy **elt-frontend** (nginx + rebuilt image with HTTPS `NEXT_PUBLIC_*`).

## AWS security group

| Port | Purpose |
|------|---------|
| 80 | HTTP → HTTPS redirect, ACME challenges |
| 443 | Public UI + proxied API/Keycloak |
| 3000 | Close public access (internal only) |

API (`8000`) and Keycloak (`8081`) can remain on the host; nginx reaches them via `host.docker.internal`.

**Host nginx:** If `http://${DEPLOY_HOST}/` shows the default *Welcome to nginx!* page, the EC2 instance has **system nginx** bound to port 80 — not `elt-frontend-proxy`. Stop it once on the server, then redeploy:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
docker rm -f elt-frontend-proxy 2>/dev/null || true
# re-run Jenkins deploy, or: bash deploy.sh
```

After a successful deploy, `http://${DEPLOY_HOST}/` should **redirect to HTTPS**. Use `https://${DEPLOY_HOST}/` for the app.

## Image tags

Compose builds `etl-frontend-image:${BUILD_NUMBER}`. Cleanup runs via [`jenkins/docker-prune.sh`](docker-prune.sh):

- `docker container prune -f`
- `docker image prune -f`
- Remove old numbered `etl-frontend-image:*` tags (keeps 2 newest)
- **`docker volume prune -f`** — orphan volumes only; `next_build_cache` stays attached to the running container

Prune runs on **every** pipeline build (`post { always }`) and again via `trap` in [`deploy.sh`](../deploy.sh) after deploy attempts.

## Verification

```bash
curl -I https://dtorch.online/
curl -I https://dtorch.online/health
docker ps | grep -E 'etl-frontend|elt-frontend-proxy'
docker inspect elt-frontend-proxy --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

Open `https://dtorch.online/login` and confirm Keycloak login completes.

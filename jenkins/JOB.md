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
| `DEPLOY_HOST` | `13.200.160.10` |
| `NEXT_PUBLIC_API_URL` | `https://13.200.160.10/api/v1` |
| `NEXT_PUBLIC_KC_URL` | `https://13.200.160.10` |
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

## TLS certificates

Before the first deploy (or automatically in [`deploy-docker.sh`](deploy-docker.sh) / [`deploy.sh`](../deploy.sh)):

```bash
DEPLOY_HOST=13.200.160.10 bash scripts/generate-self-signed-cert.sh
```

Certs are written to `nginx/certs/` (gitignored). Browsers will show a certificate warning until you replace them with Let's Encrypt certificates after a domain is configured.

Future domain cutover:

1. Point DNS A record to `DEPLOY_HOST`.
2. Run certbot with webroot `nginx/acme` (HTTP-01 via `/.well-known/acme-challenge/`).
3. Replace `nginx/certs/fullchain.pem` and `privkey.pem`, or mount Let's Encrypt paths in `docker-compose.yml`.
4. Update Jenkins `DEPLOY_HOST` / `NEXT_PUBLIC_*` to the domain and rebuild.

## Keycloak client (`workspace-web`)

After switching to HTTPS, update redirect URIs in the Keycloak admin console (**Clients → workspace-web → Valid redirect URIs**):

- `https://13.200.160.10/auth/callback`
- `https://13.200.160.10/login`
- `https://13.200.160.10/*` (post-logout and wildcard during transition)

Also add **Web origins**: `https://13.200.160.10`

Keep existing `http://13.200.160.10:3000/*` entries until migration is complete, then remove them.

When a domain is added, repeat the same steps with `https://your-domain/...`.

## Pipeline stages

1. **Test** — all branches: [`run-tests.sh`](run-tests.sh) (`npm ci`, lint, build in `node:22.13.1-alpine`)
2. **Prepare Environment** — `master` only: [`prepare-env.sh`](prepare-env.sh) → writes `.env`
3. **Deploy** — `master` only: [`deploy.sh`](../deploy.sh) → [`deploy-docker.sh`](deploy-docker.sh) in CI (workspace copied into a Docker volume; host daemon cannot bind-mount Jenkins workspace paths)
4. **Health** — `master` only: `curl -kfs https://${DEPLOY_HOST}/` with retries (`-k` accepts self-signed cert)

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

## Image tags

Compose builds `etl-frontend-image:${BUILD_NUMBER}`. Cleanup runs via [`jenkins/docker-prune.sh`](docker-prune.sh):

- `docker container prune -f`
- `docker image prune -f`
- Remove old numbered `etl-frontend-image:*` tags (keeps 2 newest)
- **`docker volume prune -f`** — orphan volumes only; `next_build_cache` stays attached to the running container

Prune runs on **every** pipeline build (`post { always }`) and again via `trap` in [`deploy.sh`](../deploy.sh) after deploy attempts.

## Verification

```bash
curl -kI https://13.200.160.10/
curl -kI https://13.200.160.10/health
docker ps | grep -E 'etl-frontend|elt-frontend-proxy'
```

Open `https://13.200.160.10/login` in a browser, accept the self-signed certificate warning, and confirm Keycloak login completes.

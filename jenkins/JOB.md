# Jenkins Pipeline job — elt-frontend

Deploy the Next.js UI via `docker-compose.yml`. Production `.env` is generated in **Prepare Environment** (same pattern as the legacy inline Jenkins script).

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
| `NEXT_PUBLIC_API_URL` | `http://13.200.160.10:8000/api/v1` |
| `NEXT_PUBLIC_KC_URL` | `http://13.200.160.10:8081` |
| `NEXT_PUBLIC_KC_REALM` | `workspace-realm` |
| `NEXT_PUBLIC_KC_CLIENT_ID` | `workspace-web` |
| `DOCKER_BUILDKIT` | `0` |

`NEXT_PUBLIC_BUILD_ID` is set to `BUILD_NUMBER` in [`prepare-env.sh`](prepare-env.sh).

No Jenkins credentials required for frontend (public build-time URLs only).

## Pipeline stages

1. **Test** — all branches: `npm ci`, lint, build with production URLs
2. **Prepare Environment** — `master` only: [`prepare-env.sh`](prepare-env.sh) → writes `.env`
3. **Deploy** — `master` only: [`deploy.sh`](../deploy.sh) (removes legacy `etl-frontend-container`, compose rebuild, prune)
4. **Health** — `master` only: `curl http://${DEPLOY_HOST}:3000` with retries

## Deploy ordering

Deploy **after** etl-back on a fresh host.

## Image tags

Compose builds `etl-frontend-image:${BUILD_NUMBER}`. Cleanup runs via [`jenkins/docker-prune.sh`](docker-prune.sh):

- `docker container prune -f`
- `docker image prune -f`
- Remove old numbered `etl-frontend-image:*` tags (keeps 2 newest)
- **`docker volume prune -f`** — orphan volumes only; `next_build_cache` stays attached to the running container

Prune runs on **every** pipeline build (`post { always }`) and again via `trap` in [`deploy.sh`](../deploy.sh) after deploy attempts.

## Verification

```bash
curl -I http://13.200.160.10:3000
docker ps | grep etl-frontend
```

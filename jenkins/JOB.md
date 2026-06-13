# Jenkins Pipeline job — elt-frontend

Deploy the Next.js UI via this repo's `docker-compose.yml`.

## Configuration

| Setting | Value |
|---------|-------|
| **Definition** | Pipeline script from SCM |
| **SCM** | Git — `elt-frontend` |
| **Branch** | `*/master` |
| **Script Path** | `Jenkinsfile` |

## Server `.env`

Copy [`.env.example`](../.env.example) to `.env` on the deploy host before first deploy:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Browser-facing API URL (baked in at build time) |
| `NEXT_PUBLIC_KC_URL` | Keycloak URL |
| `NEXT_PUBLIC_KC_REALM` | Keycloak realm |
| `NEXT_PUBLIC_KC_CLIENT_ID` | Keycloak client ID |
| `NEXT_PUBLIC_BUILD_ID` | Build identifier |

## Pipeline stages

1. **Test** — all branches: `npm ci`, lint, build (CI uses placeholder URLs)
2. **Deploy** — `master` only: [`deploy.sh`](../deploy.sh) (uses server `.env` for build args)
3. **Health** — `master` only: `curl http://127.0.0.1:3000`

## Deploy ordering

Deploy **after** etl-back on a fresh host.

## Verification

```bash
curl -I http://localhost:3000
docker ps | grep etl-frontend
```

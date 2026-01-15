# CI_AND_DEPLOYMENT.md

## Frontend: GitHub Pages

- GitHub Actions workflow: `.github/workflows/pages.yml`
- Triggers on push to `main`
- Builds `apps/web` and deploys to Pages

Vite config:
- `base: "/wow-achievement-helper/"`

Live URL:
- https://jonwhitefang.github.io/wow-achievement-helper/

## Worker: Cloudflare

GitHub Actions workflow: `.github/workflows/worker.yml`
- Triggers on push to `workers/api/**` or manual dispatch
- Requires `CLOUDFLARE_API_TOKEN` secret in GitHub

KV namespace:
- `SESSIONS` (binding configured in `wrangler.toml`)

Secrets (set via `wrangler secret put`):
- `BNET_CLIENT_ID`
- `BNET_CLIENT_SECRET`
- `SESSION_SIGNING_KEY`

Live URL:
- https://wow-achievement-helper-api.jono2411.workers.dev/

## CORS

Worker var:
- `APP_ORIGIN=https://jonwhitefang.github.io/wow-achievement-helper`

## OAuth Redirect URI

Set in Blizzard developer portal:
- `https://wow-achievement-helper-api.jono2411.workers.dev/auth/callback`

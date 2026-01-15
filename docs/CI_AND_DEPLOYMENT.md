# CI_AND_DEPLOYMENT.md

## Frontend: GitHub Pages

- Use GitHub Actions Pages workflow:
  - build `apps/web`
  - upload artifact
  - deploy

Vite:
- set `base: "/<repo-name>/"`

Router:
- prefer hash router for simplicity.

## Worker: Cloudflare

- Create KV namespace for sessions
- Set secrets:
  - `BNET_CLIENT_ID`
  - `BNET_CLIENT_SECRET`
  - `SESSION_SIGNING_KEY`

Deploy:
- `wrangler deploy`

## CORS

Worker var:
- `APP_ORIGIN=https://<user>.github.io/<repo-name>`

## OAuth Redirect URI

Set in Blizzard developer portal:
- `https://<worker-domain>/auth/callback`

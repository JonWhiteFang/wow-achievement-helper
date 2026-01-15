# WORKER_SKELETON.md

This document describes a production-ready Cloudflare Worker scaffold (TypeScript) for:

- Blizzard client_credentials token (Game Data)
- Battle.net OAuth login (Authorization Code + PKCE)
- Session storage in KV (A-mode: no user content)
- Blizzard API proxy endpoints (EU-only)
- Help provider aggregation endpoint
- CORS + caching helpers
- Error conventions

> This is intentionally a “copy-paste into files” spec with code blocks and file-level breakdown.

---

## Worker: Files & Responsibilities

```
workers/api/
  src/
    index.ts
    env.ts
    http/
      cors.ts
      cache.ts
      errors.ts
      json.ts
    auth/
      pkce.ts
      session.ts
      oauth.ts
    blizzard/
      endpoints.ts
      token.ts
      gameData.ts
      profile.ts
      realm.ts
    help/
      types.ts
      provider.ts
      wowhead.ts
      fallback.ts
      index.ts
  wrangler.toml
```

---

## `wrangler.toml` (bindings)

```toml
name = "wow-achievement-helper-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

kv_namespaces = [
  { binding = "SESSIONS", id = "<kv-id>" }
]

[vars]
APP_ORIGIN = "https://jonwhitefang.github.io/wow-achievement-helper"
BATTLE_NET_REGION = "eu"
BATTLE_NET_OAUTH_AUTHORIZE = "https://eu.battle.net/oauth/authorize"
BATTLE_NET_OAUTH_TOKEN = "https://eu.battle.net/oauth/token"
BLIZZARD_API_HOST = "https://eu.api.blizzard.com"
PROFILE_API_HOST = "https://eu.api.blizzard.com"

# Secrets (set via `wrangler secret put`)
# BNET_CLIENT_ID
# BNET_CLIENT_SECRET
# SESSION_SIGNING_KEY
```

---

## Env typings (`src/env.ts`)

```ts
export type Env = {
  SESSIONS: KVNamespace;
  APP_ORIGIN: string;

  BATTLE_NET_REGION: "eu";
  BATTLE_NET_OAUTH_AUTHORIZE: string;
  BATTLE_NET_OAUTH_TOKEN: string;

  BLIZZARD_API_HOST: string;
  PROFILE_API_HOST: string;

  BNET_CLIENT_ID: string;       // secret
  BNET_CLIENT_SECRET: string;   // secret
  SESSION_SIGNING_KEY: string;  // secret
};
```

---

## Router (`src/index.ts`)

```ts
import { Router } from "itty-router";
import { withCors } from "./http/cors";
import { json } from "./http/json";
import { err } from "./http/errors";

import { authLogin, authCallback, authMe, authLogout } from "./auth/oauth";
import { getCategories, getAchievement } from "./blizzard/gameData";
import { getCharacterAchievements, getMyCharacters, mergeMyAchievements } from "./blizzard/profile";
import { getHelpForAchievement } from "./help";

const router = Router();

router.get("/healthz", () => json({ ok: true }));

router.get("/auth/login", authLogin);
router.get("/auth/callback", authCallback);
router.get("/auth/me", authMe);
router.post("/auth/logout", authLogout);

router.get("/api/categories", getCategories);
router.get("/api/achievement/:id", getAchievement);

router.get("/api/character/:realm/:name/achievements", getCharacterAchievements);

router.get("/api/me/characters", getMyCharacters);
router.post("/api/me/merge", mergeMyAchievements);

router.get("/api/help/achievement/:id", getHelpForAchievement);

router.all("*", () => err("NOT_FOUND", "Route not found", 404));

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
    withCors(req, env, () => router.handle(req, env, ctx)),
};
```

---

## CORS Middleware (`src/http/cors.ts`)

- Allow only `env.APP_ORIGIN`
- Allow credentials

Also handle `OPTIONS` preflight.

---

## Auth: PKCE (`src/auth/pkce.ts`)

Implement:
- random verifier
- S256 challenge

---

## Auth: Session Store (`src/auth/session.ts`)

KV record:

```ts
type Session = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  battletag?: string;
};
```

Cookie:
- `session_id=<random>; HttpOnly; Secure; SameSite=Lax; Path=/`

---

## Auth: OAuth Endpoints (`src/auth/oauth.ts`)

### `/auth/login`
- generate `state`
- create PKCE pair
- KV store `pkce:<state>` => `{ verifier, created_at }` with TTL ~ 10 minutes
- redirect to authorize URL

### `/auth/callback`
- validate state
- load verifier
- exchange code -> tokens
- create session in KV
- set cookie
- redirect back to app

---

## Blizzard

- EU-only endpoints and namespaces
- client_credentials token helper
- profile endpoints for guest + logged-in

---

## Help aggregation

- provider adapter system
- return normalized `HelpPayload` always (link-only fallback if nothing)
- sanitize provider output (plain text)

---

## Observability

Log:
- route
- status
- duration
- cache hit/miss

Never log tokens.

# Worker Architecture

This document describes the architecture of the Cloudflare Worker backend in `workers/api/`.

## File Structure

```
workers/api/src/
├── index.ts              # Main entry point, request routing, CORS
├── env.ts                # Environment type definitions
├── authHandlers.ts       # OAuth login/callback/me/logout handlers
├── merge.ts              # Character merge logic
├── auth/
│   └── session.ts        # Session management (KV storage)
├── blizzard/
│   ├── character.ts      # Character achievement fetching
│   ├── gameData.ts       # Categories, achievements, realms
│   ├── manifest.ts       # Incremental manifest builder
│   ├── profile.ts        # User profile (character list)
│   └── token.ts          # Client credentials token management
├── help/
│   ├── index.ts          # Help aggregation (provider chain)
│   ├── curated.ts        # Curated strategy provider
│   ├── wowhead.ts        # Wowhead scraping provider
│   └── types.ts          # Help payload types
└── data/
    └── strategy/         # Curated strategy JSON files
        ├── README.md
        └── {achievementId}.json
```

## Request Handling (`index.ts`)

### Entry Point

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return withCors(req, env, async () => {
      // Route matching and handling
    });
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Manifest building cron job
  },
};
```

### CORS Middleware

```typescript
function withCors(req: Request, env: Env, handler: () => Response | Promise<Response>) {
  // Only allow APP_ORIGIN (GitHub Pages)
  // Handle OPTIONS preflight
  // Add CORS headers to response
}
```

### Response Helpers

```typescript
function json(data: unknown, status = 200, cacheSeconds = 0): Response
function err(code: string, message: string, status: number): Response
```

### Route Matching

Routes matched via path patterns:

```typescript
if (path === "/healthz") return json({ ok: true });
if (path === "/auth/login") return handleLogin(req, env);
if (path === "/api/manifest") return json(await getManifest(env), 200, CACHE_1H);
// ... etc
```

## Authentication (`authHandlers.ts`, `auth/session.ts`)

### OAuth Flow

1. `/auth/login`: Generate state + PKCE, store in KV, redirect to Battle.net
2. `/auth/callback`: Validate state, exchange code for tokens, create session
3. `/auth/me`: Return session info (battletag, logged in status)
4. `/auth/logout`: Clear session from KV and cookie

### Session Storage

Sessions stored in KV with structure:

```typescript
type Session = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  battletag?: string;
};
```

Key: `session:{sessionId}`
TTL: 24 hours

### Cookie

```
session_id=<random>; HttpOnly; Secure; SameSite=Lax; Path=/
```

## Blizzard API Integration

### Token Management (`blizzard/token.ts`)

Client credentials token for Game Data API:

```typescript
export async function getClientToken(env: Env): Promise<string>
```

- Fetches from `https://oauth.battle.net/token`
- Caches in memory until expiry

### Game Data (`blizzard/gameData.ts`)

```typescript
export async function fetchCategories(env: Env): Promise<CategoriesResponse>
export async function fetchAchievement(env: Env, id: number): Promise<Achievement>
export async function fetchRealms(env: Env): Promise<Realm[]>
```

All use EU endpoints with `namespace=static-eu` or `namespace=dynamic-eu`.

### Character Data (`blizzard/character.ts`)

```typescript
export async function fetchCharacterAchievements(
  env: Env,
  realm: string,
  name: string
): Promise<CharacterProgress>
```

- Uses `namespace=profile-eu`
- Handles NOT_PUBLIC and NOT_FOUND errors
- Returns completion timestamps in `completedAt`

### User Profile (`blizzard/profile.ts`)

```typescript
export async function fetchUserCharacters(
  env: Env,
  accessToken: string
): Promise<WowCharacter[]>
```

Requires user OAuth token (from session).

## Manifest Builder (`blizzard/manifest.ts`)

### Incremental Building

```typescript
export async function buildManifestIncremental(env: Env): Promise<BuildResult>
export async function getManifest(env: Env): Promise<Manifest | null>
```

Build process:
1. Fetch category index
2. For each category, fetch achievements (batched)
3. Store progress in KV (`manifest:build-state`)
4. When complete, store manifest in KV (`manifest:v1`)

### Scheduled Trigger

Configured in `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

## Merge Logic (`merge.ts`)

```typescript
export async function mergeCharacterAchievements(
  env: Env,
  characters: { realm: string; name: string }[]
): Promise<MergeResult>
```

Merge strategy:
- `completed`: Union of all completed achievement IDs
- `completedAt`: Earliest completion timestamp per achievement
- `progress`: Maximum criteria progress per achievement

Concurrency control: Fetches characters in batches to avoid rate limits.

## Help Providers (`help/`)

### Provider Chain (`help/index.ts`)

```typescript
export async function fetchHelp(achievementId: number, top: number): Promise<HelpPayload>
```

Provider priority:
1. **Curated** (`curated.ts`): JSON files in `data/strategy/`
2. **Wowhead** (`wowhead.ts`): Best-effort comment scraping
3. **Fallback**: Empty strategy/comments, Wowhead link only

### Curated Provider (`help/curated.ts`)

Reads from `data/strategy/{achievementId}.json`:

```json
{
  "achievementId": 12345,
  "strategy": [
    { "title": "Setup", "steps": ["Step 1", "Step 2"] }
  ]
}
```

### Wowhead Provider (`help/wowhead.ts`)

- Fetches Wowhead achievement page
- Parses top comments (best-effort)
- Wrapped in try/catch for resilience
- Always returns Wowhead link in sources

## Environment (`env.ts`)

```typescript
export type Env = {
  SESSIONS: KVNamespace;
  APP_ORIGIN: string;
  BNET_CLIENT_ID: string;
  BNET_CLIENT_SECRET: string;
};
```

Secrets set via `wrangler secret put`:
- `BNET_CLIENT_ID`
- `BNET_CLIENT_SECRET`

## Caching Constants

```typescript
const CACHE_24H = 86400;
const CACHE_1H = 3600;
const CACHE_5M = 300;
const CACHE_12H = 43200;
```

Applied via `Cache-Control` headers with `stale-while-revalidate`.

## Error Handling

All errors return consistent shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

Upstream errors (Blizzard API) logged and returned as `UPSTREAM_ERROR` or `BLIZZARD_ERROR`.

## Testing

Unit tests in `*.test.ts` files:
- `merge.test.ts`: Merge logic
- `auth/session.test.ts`: Session management
- `blizzard/character.test.ts`: Character normalization
- `help/types.test.ts`: Help payload validation

Run with: `npm test -w workers/api`

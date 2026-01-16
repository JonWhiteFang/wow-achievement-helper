# ARCHITECTURE.md

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Pages (Static SPA)                    │
│  React + Vite + TypeScript                                       │
│  - Renders UI                                                    │
│  - Calls backend for Blizzard data and help content              │
│  - Stores user data locally (no server persistence)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (credentials: include)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (API Proxy + OAuth)               │
│  - Server-side OAuth exchanges (secrets stay server-side)        │
│  - Calls Blizzard APIs (EU-only)                                 │
│  - Aggregates help content from providers                        │
│  - Applies caching + normalization                               │
│  - Sets session cookies (HTTPOnly)                               │
│  - Runs scheduled tasks (manifest building)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare KV Storage                         │
│  - Session storage (keyed by session_id)                         │
│  - Manifest cache                                                │
│  - Build state for incremental manifest                          │
└─────────────────────────────────────────────────────────────────┘
```

## Token Modes

### 1) Client Credentials Token (server-to-server)

Use for:

- Blizzard Game Data API calls (categories, achievements, realms)

Worker responsibilities:

- Fetch token from EU OAuth token endpoint (client_credentials)
- Cache until expiry (in-memory)
- Apply caching to responses

### 2) User OAuth Token (Authorization Code + PKCE)

Use for:

- `/profile/user/wow` character list
- Fetching achievements for multiple alts to compute merged/account-wide state

Worker responsibilities:

- Initiate login and redirect to Battle.net authorize endpoint
- Receive callback with `code`
- Exchange code for tokens server-side (using client secret)
- Create server-side session (KV) and set HTTPOnly cookie
- Refresh tokens if needed; otherwise re-auth

## Data Flow

### Guest Mode

1) User selects realm from dropdown and enters character name
2) Frontend calls `/api/character/:realm/:name/achievements`
3) Frontend overlays completion/progress over cached achievement catalogue

### Logged-in Mode

1) User clicks "Sign in"
2) Frontend navigates to `/auth/login`
3) Worker performs OAuth redirect and callback, sets session cookie
4) Frontend calls `/auth/me` and `/api/me/characters`
5) User selects characters (main + alts)
6) Frontend calls `/api/me/merge` with selected characters
7) Frontend renders merged completion/progress overlay

### Strategy/Community Help Panel

1) User opens achievement details
2) Frontend calls `/api/help/achievement/:id?top=10`
3) Worker attempts providers in priority order and returns normalized shape

## Caching Strategy

### Manifest (full catalogue)

- Built incrementally via scheduled worker
- Stored in KV with key `manifest:v1` (24h TTL)
- Response cache: 1h + SWR
- Single request loads entire category tree + achievement index + icons

### Blizzard Game Data

| Data | Response Cache | Notes |
|------|---------------|-------|
| Manifest | 1h + SWR | KV: 24h |
| Categories | 24h + SWR | Legacy endpoint |
| Achievement details | 24h + SWR | |
| Realms | 1h + SWR | For realm selector |

### Blizzard Profile (character achievements)

- Response cache: 5m + SWR
- Provide "Refresh" button in UI for user-triggered refetch

### Help Providers (strategy/community)

- Response cache: 12h
- Provide "Refresh help" button
- Always include source deep links

## Scheduled Worker

The Worker exports a `scheduled` handler that runs periodically (configured via `wrangler.toml` cron triggers):

- Runs one iteration of incremental manifest build
- Builds category tree and achievement index in batches to avoid timeout
- Progress stored in KV (`manifest:build-state`) between invocations
- Logs progress: `Manifest build: {progress}`

## Security Model

- No client secrets in frontend
- Worker uses:
  - HTTPOnly session cookie
  - KV session store (tokens + expiry + battletag)
- Strict CORS to allow only GitHub Pages origin
- Sanitize all third-party content; do not render untrusted HTML
- Limit logged-in scopes to minimum required (`wow.profile`)

## Frontend Architecture

### State Management

- React Query for server state (manifest)
- Local state for UI (selected category, drawer open/close, filters)
- localStorage for persistence:
  - Saved characters
  - Merge selections
  - Recent categories

### Routing

- React Router with hash routing for GitHub Pages compatibility
- Routes:
  - `/#/` — Home
  - `/#/category/:categoryId` — Category selected
  - `/#/category/:categoryId/achievement/:achievementId` — Achievement drawer open
  - `/#/achievement/:achievementId` — Achievement drawer (no category)
- Query params:
  - `?character=realm/name` — Load character progress

### Performance

- List virtualization with react-window
- Fuzzy search with Fuse.js (client-side, no server round-trips)
- Manifest loaded once, cached via React Query
- Achievement icons lazy-loaded with placeholder fallback

### Client-side Filtering

- Expansion filter: Maps categories to expansions using `buildCategoryExpansionMap`
- All filtering (completed/incomplete/near/expansion) happens client-side
- Points calculation done client-side from loaded data

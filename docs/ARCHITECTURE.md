# ARCHITECTURE.md

## High-Level Architecture

**GitHub Pages (Static SPA)**

- Renders the UI
- Calls backend for Blizzard data and help content
- Stores user pins/notes locally (no server persistence)

**Cloudflare Worker (API Proxy + OAuth + Aggregation)**

- Performs server-side OAuth exchanges (keeps client secrets out of the browser)
- Calls Blizzard APIs (EU-only)
- Aggregates help content (strategy + community tips) from providers
- Applies caching + normalization
- Sets session cookies (HTTPOnly)
- Runs scheduled tasks (manifest building)

## Token Modes

### 1) Client Credentials Token (server-to-server)

Use for:

- Blizzard Game Data API calls (categories and achievement definitions)

Worker responsibilities:

- Fetch token from EU OAuth token endpoint (client_credentials)
- Cache until expiry (in-memory + optionally KV)
- Apply rate-limiting guardrails and caching

### 2) User OAuth Token (Authorization Code + PKCE)

Use for:

- `/profile/user/wow` character list
- Fetching achievements for multiple alts to compute merged/account-wide state

Worker responsibilities:

- Initiate login and redirect to Battle.net authorize endpoint
- Receive callback with `code`
- Exchange code for tokens server-side (using client secret)
- Create server-side session (KV) and set HTTPOnly cookie
- Refresh tokens if supported/needed; otherwise re-auth

## Data Flow

### Guest Mode

1) User enters (realm, character name)
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

- Built incrementally via scheduled worker or admin endpoint
- Stored in KV with 24h TTL
- Response cache: 1h + SWR
- Single request loads entire category tree + achievement index

### Blizzard Game Data (slow-changing)

- Cache aggressively (24h–7d)
- Use stale-while-revalidate for responsiveness

### Blizzard Profile (character achievements)

- Cache short (5m)
- Provide "Refresh" button in UI for user-triggered refetch

### Help Providers (strategy/community)

- Cache per achievement (12h)
- Provide "Refresh help" button
- Always include source deep links

## Scheduled Worker

The Worker exports a `scheduled` handler that runs periodically (configured via `wrangler.toml` cron triggers):

- Runs one iteration of incremental manifest build
- Builds category tree and achievement index in batches to avoid timeout
- Progress stored in KV between invocations

## Security Model

- No client secrets in frontend
- Worker uses:
  - HTTPOnly session cookie
  - KV session store (tokens + expiry)
- Strict CORS to allow only GitHub Pages origin
- Sanitize all third-party content; do not render untrusted HTML without sanitization
- Limit logged-in scopes to minimum required

## Frontend Architecture

### State Management

- React Query for server state (manifest, help content)
- Local state for UI (selected category, drawer open/close)
- localStorage for persistence (saved characters, merge selections, recent categories)

### Routing

- React Router with hash routing for GitHub Pages compatibility
- Routes: `/#/`, `/#/achievement/:id`, `/#/category/:id`

### Performance

- List virtualization with react-window
- Fuzzy search with Fuse.js (client-side, no server round-trips)
- Manifest loaded once, cached via React Query

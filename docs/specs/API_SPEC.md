# API_SPEC.md

## Overview

All endpoints are served by the Cloudflare Worker at `https://wow-achievement-helper-api.jono2411.workers.dev`.
Frontend is hosted on GitHub Pages at `https://jonwhitefang.github.io/wow-achievement-helper`.

EU-only: All Blizzard calls MUST use EU region endpoints/namespaces.

---

## Health Check

### `GET /healthz`

Simple health check endpoint.

Response 200:

```json
{ "ok": true }
```

---

## Auth Endpoints

### `GET /auth/login`

Starts OAuth login (Authorization Code + PKCE).

Behavior:

- Generates `state`, `code_verifier`, `code_challenge`
- Stores state + code_verifier temporarily (KV)
- Redirects user to Battle.net authorization URL

Response:

- 302 redirect

### `GET /auth/callback?code=...&state=...`

Completes OAuth login.

Behavior:

- Validates state
- Exchanges code -> tokens (server-side)
- Creates a session in KV
- Sets `Set-Cookie: session_id=...; HttpOnly; Secure; SameSite=Lax; Path=/`
- Redirects back to frontend

Response:

- 302 redirect

### `GET /auth/me`

Returns minimal session info.

Response 200:

```json
{
  "loggedIn": true,
  "battletag": "User#1234"
}
```

Response 200 (not logged in):

```json
{ "loggedIn": false }
```

Response 200 (session expired):

```json
{ "loggedIn": false, "sessionExpired": true }
```

### `POST /auth/logout`

Clears session cookie and removes KV entry.

Response 200:

```json
{ "ok": true }
```

---

## Blizzard Game Data Endpoints

### `GET /api/manifest`

Returns the full achievement catalogue: nested category tree + all achievement summaries.

This is the **preferred endpoint** for initial data loading. Built incrementally via scheduled worker and cached in KV.

Caching:

- KV: 24h
- Response: 1h + SWR

Response 200:

```json
{
  "categories": [
    {
      "id": 92,
      "name": "General",
      "children": [{ "id": 96, "name": "Quests", "children": [] }]
    }
  ],
  "achievements": [
    { "id": 12345, "name": "Achievement Name", "points": 10, "categoryId": 92, "icon": "achievement_icon" }
  ],
  "builtAt": "2026-01-14T00:00:00Z"
}
```

Response 503 (manifest still building):

```json
{
  "error": "NOT_READY",
  "message": "Manifest is being built, please try again later"
}
```

### `GET /api/categories`

Legacy endpoint. Returns the category tree (proxies manifest data).

Caching:

- Response: 24h + SWR

Response 200:

```json
{
  "categories": [...],
  "achievements": [...],
  "generatedAt": "2026-01-14T00:00:00Z"
}
```

### `GET /api/achievement/:id`

Returns achievement definition and criteria.

Caching:

- Response: 24h + SWR

Response 200:

```json
{
  "id": 12345,
  "name": "Achievement Name",
  "description": "Do the thing",
  "points": 10,
  "isAccountWide": true,
  "reward": { "title": null, "item": { "id": 123, "name": "Item Name" } },
  "categoryId": 92,
  "criteria": [
    { "id": 1, "description": "Kill X", "amount": 1 }
  ],
  "icon": "achievement_icon"
}
```

### `GET /api/realms`

Returns list of EU realms for the realm selector dropdown.

Caching:

- Response: 1h + SWR

Response 200:

```json
{
  "realms": [
    { "name": "Argent Dawn", "slug": "argent-dawn" },
    { "name": "Silvermoon", "slug": "silvermoon" }
  ]
}
```

---

## Guest Character Lookup

### `GET /api/character/:realm/:name/achievements`

Public character achievement state.

Notes:

- Fails if character hides achievements via privacy settings.
- Realm should be the slug (lowercase, hyphenated).

Caching:

- Response: 5m + SWR

Response 200:

```json
{
  "character": { "realm": "silvermoon", "name": "Someguy" },
  "completed": [12345, 67890],
  "completedAt": { "12345": 1704067200, "67890": 1704153600 },
  "progress": {
    "12346": { "completedCriteria": 2, "totalCriteria": 5 }
  },
  "fetchedAt": "2026-01-14T12:00:00Z"
}
```

Response 403/404:

```json
{
  "error": "NOT_PUBLIC",
  "message": "This character's achievements are not publicly visible."
}
```

---

## Logged-in Character List

### `GET /api/me/characters`

Requires session cookie.

Behavior:

- Calls Blizzard `/profile/user/wow` to retrieve linked WoW accounts and characters.
- Returns a flattened list suitable for UI selection.

Response 200:

```json
{
  "characters": [
    { "realm": "silvermoon", "name": "Mainchar", "level": 80, "id": "silvermoon/Mainchar" }
  ]
}
```

Response 401:

```json
{ "error": "UNAUTHENTICATED", "message": "Not logged in" }
```

---

## Logged-in Merge

### `POST /api/me/merge`

Requires session cookie.

Request body:

```json
{
  "characters": [
    { "realm": "silvermoon", "name": "Mainchar" },
    { "realm": "silvermoon", "name": "Altchar" }
  ]
}
```

Behavior:

- Fetches each character's achievements (with concurrency control)
- Merges into a unified account-wide view:
  - Completed: union of completed IDs
  - CompletedAt: earliest completion timestamp per achievement
  - Progress: best-known progress by achievement

Response 200:

```json
{
  "merged": {
    "completed": [12345, 67890],
    "completedAt": { "12345": 1704067200 },
    "progress": {
      "12346": { "completedCriteria": 3, "totalCriteria": 5 }
    }
  },
  "sources": [
    { "realm": "silvermoon", "name": "Mainchar" },
    { "realm": "silvermoon", "name": "Altchar" }
  ],
  "fetchedAt": "2026-01-14T12:01:00Z"
}
```

---

## Strategy + Community Help

### `GET /api/help/achievement/:id?top=10`

Returns normalized help content from providers.

Caching:

- Response: 12h

Response 200:

```json
{
  "achievementId": 12345,
  "strategy": [
    {
      "title": "Route / Setup",
      "steps": ["Step 1...", "Step 2..."]
    }
  ],
  "comments": [
    {
      "author": "User123",
      "text": "Tip: do this during X",
      "score": null,
      "date": null
    }
  ],
  "sources": [
    { "name": "Wowhead", "url": "https://www.wowhead.com/achievement=12345" }
  ]
}
```

---

## Admin Endpoints

### `POST /api/admin/build-manifest`

Triggers one iteration of the incremental manifest build. Call repeatedly until `done: true`.

Query params:

- `?reset=true` — clears build state and cached manifest

Response 200:

```json
{ "done": false, "progress": "Building category 15 of 120" }
```

Response 200 (complete):

```json
{ "done": true, "progress": "Complete" }
```

Response 200 (reset):

```json
{ "reset": true }
```

---

## Error Conventions

All non-2xx responses follow:

```json
{
  "error": "SOME_CODE",
  "message": "Human readable",
  "details": { "optional": true }
}
```

Common error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHENTICATED` | 401 | Missing or invalid session |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `NOT_PUBLIC` | 403 | Character achievements are private |
| `NOT_FOUND` | 404 | Resource not found |
| `NOT_READY` | 503 | Manifest still building |
| `RATE_LIMITED` | 429 | Too many requests |
| `UPSTREAM_ERROR` | 502 | Blizzard API error |
| `BLIZZARD_ERROR` | 502 | Blizzard API error |
| `BUILD_ERROR` | 500 | Manifest build failed |
| `INVALID_INPUT` | 400 | Invalid request parameters |

---

## Caching Summary

| Endpoint | Response Cache | Notes |
|----------|---------------|-------|
| `/api/manifest` | 1h + SWR | KV: 24h |
| `/api/categories` | 24h + SWR | Legacy |
| `/api/achievement/:id` | 24h + SWR | |
| `/api/realms` | 1h + SWR | |
| `/api/character/.../achievements` | 5m + SWR | |
| `/api/help/achievement/:id` | 12h | |
| `/api/me/*` | No cache | Auth required |

# API_SPEC.md

## Overview

All endpoints are served by the Cloudflare Worker at `https://wow-achievement-helper-api.jono2411.workers.dev`.
Frontend is hosted on GitHub Pages at `https://jonwhitefang.github.io/wow-achievement-helper`.

EU-only: All Blizzard calls MUST use EU region endpoints/namespaces.

---

## Auth Endpoints

### `GET /auth/login`

Starts OAuth login (Authorization Code + PKCE).

Behavior:

- Generates `state`, `code_verifier`, `code_challenge`
- Stores state + code_verifier temporarily (KV or encrypted cookie)
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
- Redirects back to frontend (e.g. `/app`)

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

### `POST /auth/logout`

Clears session cookie and removes KV entry.

Response 200:

```json
{ "ok": true }
```

---

## Blizzard Game Data Endpoints

### `GET /api/categories`

Returns the full achievement category tree (or sufficient to build it).

Caching:

- 24h+ (stale-while-revalidate)

Response 200 (example shape):

```json
{
  "categories": [
    {
      "id": 92,
      "name": "General",
      "children": [{ "id": 96, "name": "Quests", "children": [] }]
    }
  ],
  "generatedAt": "2026-01-14T00:00:00Z"
}
```

### `GET /api/achievement/:id`

Returns achievement definition and criteria.

Caching:

- 24h+

Response 200 (example):

```json
{
  "id": 12345,
  "name": "Achievement Name",
  "description": "Do the thing",
  "points": 10,
  "isAccountWide": true,
  "reward": { "title": null, "item": null },
  "categoryId": 92,
  "criteria": [
    { "id": 1, "description": "Kill X", "amount": 1 }
  ]
}
```

---

## Guest Character Lookup

### `GET /api/character/:realm/:name/achievements`

Public character achievement state.

Notes:

- This can fail if the character hides achievements via privacy settings.
- Use a short cache (1–5m).
- Realm normalization and slug rules must match Blizzard expectations.

Response 200:

```json
{
  "character": { "realm": "silvermoon", "name": "Someguy" },
  "completed": [12345, 67890],
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
{ "error": "UNAUTHENTICATED" }
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

- Fetches each character’s achievements
- Merges into a unified account-wide view:
  - Completed: union of completed IDs
  - Progress: best-known progress by achievement

Response 200:

```json
{
  "merged": {
    "completed": [12345, 67890],
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

Returns normalized help content.

Caching:

- 6–24h

Response 200:

```json
{
  "achievementId": 12345,
  "strategy": [
    {
      "title": "Route / Setup",
      "steps": [
        "Step 1...",
        "Step 2..."
      ]
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

Fallback behavior:

- If no providers yield structured content, return:
  - empty `strategy/comments`
  - sources includes link-only Wowhead deep link

---

## Error Conventions

All non-2xx responses MUST follow:

```json
{
  "error": "SOME_CODE",
  "message": "Human readable",
  "details": { "optional": true }
}
```

Common error codes:

- `UNAUTHENTICATED`
- `NOT_PUBLIC`
- `NOT_FOUND`
- `RATE_LIMITED`
- `UPSTREAM_ERROR`
- `INVALID_INPUT`

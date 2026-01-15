# PROJECT_OVERVIEW.md

## Goal

Build a World of Warcraft (Retail, EU-only) achievement helper website that:

- Lets users browse achievements in a logical, in-game-like category tree
- Supports fast global search + modern filters
- Lets users view achievement details (criteria/progress/reward)
- Shows a help panel with strategy + community tips (provider fallback; Wowhead first when possible)
- Supports both:
  - Guest public character lookup
  - Battle.net login (Authorization Code + PKCE) for better account-wide accuracy

Hosting:

- Frontend: GitHub Pages (static React/Vite app)
- Backend: Cloudflare Worker (OAuth + Blizzard API proxy + help-provider aggregation)

Non-goals:

- No multi-language (assume English only)
- No server-side storage of user content (pins/notes remain client-side only)

## Key Product Constraints

### “Account-wide achievements”

- True “account-wide across all alts” cannot be computed perfectly from public-only data.
- Logged-in mode allows fetching the user’s character list and merging achievement completion across selected alts.
- Guest mode supports “manual alt merge” if users add alts, but it’s less reliable.

### Third-party strategy/community content

Strategy + top comments should be provided via a provider-adapter system:

1) Wowhead provider (preferred if permitted and stable)
2) Secondary open sources provider(s)
3) Link-only fallback (always include deep link to Wowhead)

The UI MUST NOT assume a single provider; it consumes a unified response shape.

## Tech Stack

Frontend:

- React + Vite + TypeScript
- Client-side storage: localStorage/IndexedDB for pins, notes, saved characters
- Virtualized lists for performance (achievements are large)
- Router: React Router
- State: lightweight store (Zustand or Redux Toolkit; pick one)

Backend:

- Cloudflare Worker (TypeScript)
- KV for session storage (session id -> tokens and minimal user info)
- Strong caching for Game Data and strategy/community responses
- CORS enabled for GitHub Pages origin

Data sources:

- Blizzard Game Data API (achievement catalogue & categories)
- Blizzard Profile API (character achievements; user character list via `/profile/user/wow`)
- Strategy/community providers (Wowhead first, fallback)

## Repo Layout

Monorepo:

- `apps/web`: frontend (GitHub Pages deploy)
- `workers/api`: Cloudflare Worker
- `packages/core`: shared types/utilities (optional but recommended)
- `docs`: documentation

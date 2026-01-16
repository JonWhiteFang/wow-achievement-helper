# PROJECT_OVERVIEW.md

## Goal

Build a World of Warcraft (Retail, EU-only) achievement helper website that:

- Lets users browse achievements in a logical, in-game-like category tree
- Supports fast global search + modern filters
- Lets users view achievement details (criteria/progress/reward)
- Shows a help panel with strategy + community tips (curated first, Wowhead fallback)
- Supports both:
  - Guest public character lookup
  - Battle.net login (Authorization Code + PKCE) for better account-wide accuracy

Hosting:

- Frontend: GitHub Pages (static React/Vite app)
- Backend: Cloudflare Worker (OAuth + Blizzard API proxy + help-provider aggregation)

Non-goals:

- No multi-language (assume English only)
- No server-side storage of user content (pins/notes remain client-side only)

## Current Status

✅ **All core features implemented** — see `IMPLEMENTATION_PLAN.md`

Remaining polish items tracked in `TODO.md`.

## Key Product Constraints

### "Account-wide achievements"

- True "account-wide across all alts" cannot be computed perfectly from public-only data.
- Logged-in mode allows fetching the user's character list and merging achievement completion across selected alts.
- Guest mode supports single character lookup.

### Third-party strategy/community content

Strategy + top comments are provided via a provider-adapter system:

1) Curated strategies (JSON files, community-contributed via PRs)
2) Wowhead comments (best-effort scraping with resilience)
3) Link-only fallback (always include deep link to Wowhead)

The UI consumes a unified response shape and doesn't assume any single provider.

## Tech Stack

Frontend:

- React + Vite + TypeScript
- React Query for server state
- Fuse.js for fuzzy search
- react-window for list virtualization
- React Router (hash routing)
- Client-side storage: localStorage for pins, notes, saved characters

Backend:

- Cloudflare Worker (TypeScript)
- KV for session storage and manifest caching
- Scheduled worker for manifest building
- Strong caching for Game Data and strategy/community responses
- CORS enabled for GitHub Pages origin

Data sources:

- Blizzard Game Data API (achievement catalogue & categories)
- Blizzard Profile API (character achievements; user character list via `/profile/user/wow`)
- Curated strategy files + Wowhead (fallback)

## Repo Layout

Monorepo:

- `apps/web`: frontend (GitHub Pages deploy)
- `workers/api`: Cloudflare Worker
- `docs`: documentation

## Links

- **Live site:** https://jonwhitefang.github.io/wow-achievement-helper/
- **API:** https://wow-achievement-helper-api.jono2411.workers.dev/

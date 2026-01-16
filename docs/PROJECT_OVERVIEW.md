# PROJECT_OVERVIEW.md

## Goal

Build a World of Warcraft (Retail, EU-only) achievement helper website that:

- Lets users browse achievements in a logical, in-game-like category tree
- Supports fast global search + modern filters
- Lets users view achievement details (criteria/progress/reward)
- Shows a help panel with strategy + community tips
- Supports both:
  - Guest public character lookup
  - Battle.net login for account-wide merge view

Hosting:

- Frontend: GitHub Pages (static React/Vite app)
- Backend: Cloudflare Worker (OAuth + Blizzard API proxy + help-provider aggregation)

Non-goals:

- No multi-language (English only)
- No server-side storage of user content (pins/notes remain client-side only)

## Current Status

✅ **All core features implemented** — see `IMPLEMENTATION_PLAN.md`

Remaining polish items tracked in `TODO.md`.

## Features

### Core
- ✅ Browse achievements by category (deep nested tree)
- ✅ Fuzzy search achievements (Fuse.js)
- ✅ View achievement details (criteria, rewards, description)
- ✅ Guest character lookup with progress overlay
- ✅ Battle.net login with OAuth
- ✅ Account-wide merge across multiple characters
- ✅ Character comparison mode (compare two characters side-by-side)
- ✅ Strategy tips and community comments

### Filtering & Sorting
- ✅ Filter: All / Completed / Incomplete / Near Complete (80%+) / Pinned
- ✅ Sort: Name / Points / Completion
- ✅ Expansion filter dropdown
- ✅ Reward type filter (title, mount, pet, toy, transmog, other)
- ✅ Account-wide only toggle

### UI Enhancements
- ✅ Realm selector dropdown (fetches EU realms)
- ✅ Points display (earned / total)
- ✅ Recently completed achievements list
- ✅ Category completion bars with progress
- ✅ Achievement icons from Blizzard CDN
- ✅ Breadcrumb navigation
- ✅ Recent categories
- ✅ Mobile responsive layout
- ✅ Dark/light theme toggle
- ✅ Pins and notes (localStorage persistence)
- ✅ Export to CSV and share link functionality
- ✅ Progress statistics display

### Technical
- ✅ List virtualization (react-window)
- ✅ React Query for caching
- ✅ Deep linking with React Router
- ✅ Session expiry handling
- ✅ Playwright smoke tests
- ✅ Sentry integration for error tracking

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
- Client-side storage: localStorage

Backend:

- Cloudflare Worker (TypeScript)
- KV for session storage and manifest caching
- Scheduled worker for manifest building

Data sources:

- Blizzard Game Data API (achievement catalogue & categories)
- Blizzard Profile API (character achievements; user character list)
- Curated strategy files + Wowhead (fallback)

## Repo Layout

Monorepo:

- `apps/web`: frontend (GitHub Pages deploy)
- `workers/api`: Cloudflare Worker
- `docs`: documentation

## Links

- **Live site:** https://jonwhitefang.github.io/wow-achievement-helper/
- **API:** https://wow-achievement-helper-api.jono2411.workers.dev/

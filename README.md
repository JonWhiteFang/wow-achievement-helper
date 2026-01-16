# WoW Achievement Helper

A World of Warcraft achievement browser and tracker for EU Retail.

## Features

- ✅ Browse achievement catalogue by category (deep nested tree)
- ✅ Fuzzy search achievements
- ✅ View completion status for any public character
- ✅ Login with Battle.net to see your own characters
- ✅ Merge view across multiple characters for account-wide progress
- ✅ Strategy tips and community comments

## Tech Stack

- **Frontend:** React + Vite + TypeScript → GitHub Pages
- **Backend:** Cloudflare Worker → Blizzard API proxy + OAuth

## Development

```bash
# Install dependencies
npm install

# Run frontend (http://localhost:5173)
npm run dev:web

# Run worker (http://localhost:8787)
npm run dev:worker

# Run tests
npm run test

# Typecheck
npm run typecheck
```

## Links

- **Live site:** https://jonwhitefang.github.io/wow-achievement-helper/
- **API:** https://wow-achievement-helper-api.jono2411.workers.dev/

## Docs

See `/docs` for architecture, API spec, and implementation plan:

- `API_SPEC.md` — endpoint shapes and error conventions
- `ARCHITECTURE.md` — flows, caching, security model
- `UX_SPEC.md` — UI behaviors and layout
- `IMPLEMENTATION_PLAN.md` — milestones (all complete)
- `TODO.md` — remaining polish items

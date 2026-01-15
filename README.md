# WoW Achievement Helper

A World of Warcraft achievement browser and tracker for EU Retail.

## Features (planned)

- Browse achievement catalogue by category
- Search achievements
- View completion status for any public character
- Login with Battle.net to see your own characters
- Merge view across multiple characters for account-wide progress
- Strategy tips and community comments

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
```

## Links

- **Live site:** https://jonwhitefang.github.io/wow-achievement-helper/
- **API:** https://wow-achievement-helper-api.jono2411.workers.dev/

## Docs

See `/docs` for architecture, API spec, and implementation plan.

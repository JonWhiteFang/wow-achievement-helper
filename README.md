# WoW Achievement Helper

A World of Warcraft achievement browser and tracker for EU Retail.

## Features

- ✅ Browse achievement catalogue by category (deep nested tree)
- ✅ Fuzzy search achievements
- ✅ Filter by completion status, expansion, near-complete
- ✅ View completion status for any public character
- ✅ Login with Battle.net to see your own characters
- ✅ Merge view across multiple characters for account-wide progress
- ✅ Strategy tips and community comments
- ✅ Points tracking and category progress bars
- ✅ Mobile responsive layout

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

See [Local Development Guide](docs/guides/LOCAL_DEVELOPMENT.md) for detailed setup instructions.

## Links

- **Live site:** https://jonwhitefang.github.io/wow-achievement-helper/
- **API:** https://wow-achievement-helper-api.jono2411.workers.dev/

## Documentation

### Getting Started
- [Local Development](docs/guides/LOCAL_DEVELOPMENT.md) — Setup guide
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md) — Common issues

### Reference
- [API Reference](docs/API_REFERENCE.md) — Quick API reference
- [API Spec](docs/specs/API_SPEC.md) — Detailed endpoint specs
- [Architecture](docs/specs/ARCHITECTURE.md) — System design

### Architecture
- [Frontend Architecture](docs/architecture/FRONTEND_ARCHITECTURE.md)
- [Worker Architecture](docs/architecture/WORKER_ARCHITECTURE.md)

### Project
- [Project Overview](docs/PROJECT_OVERVIEW.md) — Goals and status
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Milestones (all complete)
- [TODO](docs/TODO.md) — Remaining polish items

## Contributing

See [CONTRIBUTING.md](.kiro/steering/CONTRIBUTING.md) for guidelines.

The easiest way to contribute is adding achievement strategies — see [strategy README](workers/api/src/data/strategy/README.md).

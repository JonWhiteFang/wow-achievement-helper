# Contributing

## Quick Start

```bash
# Clone and install
git clone https://github.com/JonWhiteFang/wow-achievement-helper.git
cd wow-achievement-helper
npm install

# Run locally
npm run dev:web     # Frontend at http://localhost:5173
npm run dev:worker  # Worker at http://localhost:8787
```

## Adding Curated Strategies

The easiest way to contribute is adding achievement strategies.

1. Create `workers/api/src/data/strategy/{achievementId}.json`:

```json
{
  "achievementId": 12345,
  "strategy": [
    {
      "title": "Setup",
      "steps": [
        "Step 1 description",
        "Step 2 description"
      ]
    }
  ]
}
```

2. Test locally with `npm run dev:worker`
3. Submit PR with title: `strategy: add {achievement name}`

See `workers/api/src/data/strategy/README.md` for format details.

## Code Changes

### PR Requirements

- Clear description of what changed
- How to test the change
- Screenshots for UI changes
- Passes `npm run lint` and `npm run typecheck`

### Commit Style

```
web: add achievement filter
worker: implement /api/realms endpoint
docs: update API spec
strategy: add Glory of the Raider
```

### Areas

- `apps/web/` — React frontend
- `workers/api/` — Cloudflare Worker
- `docs/` — Documentation
- `.kiro/` — Agent configs and steering docs

## Code Review

- Security: No secrets in frontend, tokens stay server-side
- Caching: Appropriate TTLs, no unnecessary cookie sending
- Errors: Graceful handling, user-friendly messages
- Docs: Update specs if API/UI behavior changes

## Questions?

Open an issue or check existing docs in `/docs`.

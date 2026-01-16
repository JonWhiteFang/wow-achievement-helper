# Local Development Guide

This guide covers setting up and running the WoW Achievement Helper locally.

## Prerequisites

- **Node.js 20+** (check with `node --version`)
- **npm** (comes with Node.js)
- **Wrangler CLI** (installed automatically via npm)
- **Blizzard Developer Account** (for API credentials)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/JonWhiteFang/wow-achievement-helper.git
cd wow-achievement-helper

# Install dependencies
npm install

# Run frontend (http://localhost:5173)
npm run dev:web

# Run worker (http://localhost:8787) - in another terminal
npm run dev:worker
```

## Detailed Setup

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

This installs dependencies for both `apps/web` and `workers/api` workspaces.

### 2. Configure Environment

**Frontend** (`apps/web/.env.development`):

Already configured to point to local worker:

```
VITE_API_BASE=http://localhost:8787
```

**Worker** - Create `workers/api/.dev.vars`:

```
BNET_CLIENT_ID=your_client_id
BNET_CLIENT_SECRET=your_client_secret
```

### 3. Get Blizzard API Credentials

1. Go to https://develop.battle.net/
2. Create a new application
3. Set OAuth redirect URI to: `http://localhost:8787/auth/callback`
4. Copy Client ID and Client Secret to `.dev.vars`

### 4. Run the Services

**Terminal 1 - Frontend:**

```bash
npm run dev:web
```

Opens at http://localhost:5173

**Terminal 2 - Worker:**

```bash
npm run dev:worker
```

Runs at http://localhost:8787

## Development Workflows

### Adding a Curated Strategy

1. Find the achievement ID (from URL or drawer)
2. Create `workers/api/src/data/strategy/{id}.json`:

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

3. Test locally by opening the achievement drawer
4. Submit PR with title: `strategy: add {achievement name}`

### Testing API Changes

```bash
# Run worker tests
npm run test

# Test specific endpoint with curl
curl http://localhost:8787/healthz
curl http://localhost:8787/api/realms
```

### Testing Frontend Changes

```bash
# Run Playwright tests (requires built frontend)
npm run build:web
npm run test:e2e

# Or run against production
TEST_URL=https://jonwhitefang.github.io/wow-achievement-helper/ npm run test:e2e
```

### Type Checking

```bash
# Check all
npm run typecheck

# Check specific workspace
npm run typecheck:web
npm run typecheck:worker
```

### Linting

```bash
npm run lint
```

## Building the Manifest

The achievement manifest is built incrementally. For local development:

```bash
# Trigger a build iteration (repeat until done: true)
curl -X POST http://localhost:8787/api/admin/build-manifest

# Reset and rebuild from scratch
curl -X POST "http://localhost:8787/api/admin/build-manifest?reset=true"
```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar) - for better TS support

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### WebStorm

- Enable ESLint integration
- Set Prettier as default formatter
- Configure TypeScript to use workspace version

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start frontend dev server |
| `npm run dev:worker` | Start worker dev server |
| `npm run build:web` | Build frontend for production |
| `npm run build:worker` | Build worker for production |
| `npm run typecheck` | Type check all workspaces |
| `npm run lint` | Lint all files |
| `npm run test` | Run worker unit tests |
| `npm run test:e2e` | Run Playwright tests |

## Environment Files

| File | Purpose |
|------|---------|
| `apps/web/.env.development` | Frontend dev config |
| `apps/web/.env.production` | Frontend prod config |
| `workers/api/.dev.vars` | Worker secrets (local only, gitignored) |
| `workers/api/wrangler.toml` | Worker configuration |

## Next Steps

- Read [FRONTEND_ARCHITECTURE.md](architecture/FRONTEND_ARCHITECTURE.md) for frontend details
- Read [WORKER_ARCHITECTURE.md](architecture/WORKER_ARCHITECTURE.md) for backend details
- Check [TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) if you hit issues
- See [TODO.md](TODO.md) for contribution opportunities

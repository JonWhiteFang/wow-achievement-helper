# IMPLEMENTATION_PLAN.md

## Status: ✅ All Phases Complete

All core features have been implemented. See `TODO.md` for remaining polish items.

## Milestones Overview

MVP target:
- ✅ browse achievements
- ✅ search
- ✅ view details
- ✅ guest character progress overlay

Then:
- ✅ Battle.net login + character list + merge "account-wide" view

Then:
- ✅ help panel providers + polish

---

## Phase 0 — Project Bootstrap ✅

### Tasks

- ✅ Create monorepo structure:
  - `apps/web`
  - `workers/api`
  - `packages/core` (optional)
  - `docs`
- ✅ Add tooling:
  - TypeScript configs
  - ESLint + Prettier
- ✅ Setup CI:
  - GitHub Actions: build `apps/web` and deploy to GH Pages
- ✅ Setup Cloudflare:
  - Create Worker
  - Add KV namespace (sessions)
  - Configure env vars and secrets

### Deliverables

- ✅ Repo structure committed
- ✅ GH Pages deploy working with placeholder page
- ✅ Worker "hello world" endpoint reachable

---

## Phase 1 — Blizzard Game Data Catalogue ✅

### Goal

Build the achievement catalogue and category tree, cached and fast.

### Worker tasks

- ✅ Implement client_credentials token acquisition + caching
- ✅ Implement:
  - `GET /api/manifest` (full category tree + achievements in one request)
  - `GET /api/categories` (legacy, proxies manifest)
  - `GET /api/achievement/:id`
- ✅ Add caching headers:
  - manifest: 1h + SWR (KV: 24h)
  - categories: 24h + SWR
  - achievement: 24h + SWR
- ✅ Incremental manifest builder with scheduled worker

### Web tasks

- ✅ Build data layer:
  - fetch manifest, render category tree
  - fetch achievement details on demand
- ✅ Create main layout scaffolding:
  - top bar + left tree + center list + right drawer
- ✅ Add fuzzy search (Fuse.js) over local index
- ✅ React Query for manifest caching

### Deliverables

- ✅ Category tree visible and navigable (deep nesting)
- ✅ Clicking an achievement shows details drawer
- ✅ Baseline performance acceptable

---

## Phase 2 — Guest Character Lookup Overlay ✅

### Goal

Allow public character lookup and overlay completion/progress onto the catalogue.

### Worker tasks

- ✅ Implement:
  - `GET /api/character/:realm/:name/achievements`
- ✅ Realm normalization:
  - implement a normalization strategy (slugging + mapping)
- ✅ Error handling:
  - privacy blocked -> `NOT_PUBLIC`
  - not found -> `NOT_FOUND`

### Web tasks

- ✅ Add character lookup UI
- ✅ Store selected character in localStorage
- ✅ Fetch character achievement state and overlay:
  - completed achievements
  - progress summaries
- ✅ Add filters:
  - Completed / Incomplete
- ✅ Add "Refresh progress" button

### Deliverables

- ✅ User can view completion state for a public character
- ✅ Lists and category counts reflect completion

---

## Phase 3 — Battle.net Login (Authorization Code + PKCE) ✅

### Goal

Enable login and access to the user's character list.

### Worker tasks

- ✅ Implement:
  - `GET /auth/login`
  - `GET /auth/callback`
  - `GET /auth/me`
  - `POST /auth/logout`
- ✅ Session storage:
  - KV keyed by random session id
  - store tokens + expiry + battletag (optional)
- ✅ CORS:
  - allow GH Pages origin
- ✅ Add `/api/me/characters` calling Blizzard `/profile/user/wow`
- ✅ Token refresh handling

### Web tasks

- ✅ Add "Sign in with Battle.net"
- ✅ Post-login state:
  - call `/auth/me`
  - display battletag or "Logged in"
- ✅ Character merge modal UI:
  - list characters from `/api/me/characters`
  - allow selection and save selection locally
- ✅ Session expiry banner

### Deliverables

- ✅ Login works end-to-end
- ✅ User can see their character list

---

## Phase 4 — Account-Wide Merge ✅

### Goal

Compute a better account-wide view by merging achievements across selected characters.

### Worker tasks

- ✅ Implement `POST /api/me/merge`
- ✅ Merge logic v1:
  - completed = union
  - progress = max(completedCriteria) per achievement
- ✅ Rate-limits:
  - concurrency control (fetch in small batches)
- ✅ Caching:
  - short cache for merge results (30–120s) keyed by selection hash

### Web tasks

- ✅ Add "Account-wide (Merged)" mode toggle
- ✅ Label clearly:
  - "Merged view (N characters)"
- ✅ Allow switching to single character quickly
- ✅ Persist merge selection locally
- ✅ "Select all max-level" quick action

### Deliverables

- ✅ Merged account view is accurate and fast
- ✅ UI supports switching and refresh

---

## Phase 5 — Help Panel (Strategy + Community Tips) ✅

### Goal

Show strategy steps and top 5–10 community comments in achievement detail.

### Worker tasks

- ✅ Implement provider adapter system
- ✅ Implement `GET /api/help/achievement/:id?top=10`
- ✅ Provider v1: Curated strategies (JSON files)
- ✅ Provider v2: Wowhead best-effort (with resilience)
- ✅ Link-only fallback
- ✅ Sanitization:
  - return plain text by default
- ✅ Cache:
  - 12h per achievement

### Web tasks

- ✅ Add "Strategy" and "Community" tabs
- ✅ Render help payload and source links
- ✅ Add "Refresh help" button
- ✅ Add skeleton loaders + error states

### Deliverables

- ✅ Help panel provides actionable info for many achievements
- ✅ Always includes source links

---

## Phase 6 — Polish, Performance, Quality ✅

### UX improvements

- ✅ Fuzzy search (Fuse.js) over local index
- ✅ Breadcrumb navigation for categories
- ✅ Recent categories (localStorage)
- ✅ "Azeroth Dark" UI theme with CSS variables
- ⏳ "Smart lists": pinned, near-complete (see TODO.md)
- ⏳ Better filters: expansion, meta, rewards (see TODO.md)
- ⏳ Mobile responsive refinements (see TODO.md)

### Engineering improvements

- ✅ React Query for manifest caching
- ✅ List virtualization (react-window)
- ✅ Basic request logging (Worker)
- ✅ Error boundary (frontend)
- ✅ Playwright smoke tests
- ⏳ Sentry integration (prepared, see TODO.md)

### Deliverables

- ✅ Fast, modern, stable user experience
- ✅ Robust against upstream slowness and provider failures

---

## Testing Plan (Minimum) ✅

Worker:

- ✅ Unit tests:
  - session creation/validation
  - merge logic
  - help-provider normalization output shape
  - character realm normalization

Web:

- ✅ Playwright smoke tests:
  - loads manifest + opens a drawer

---

## Definition of Done (Project-level) ✅

- ✅ Guest mode: can search/browse and see completion for a public character
- ✅ Logged-in mode: can select multiple characters and see merged view
- ✅ Achievement detail panel: criteria + help content + source links
- ✅ Runs fast on mobile and desktop
- ✅ GitHub Pages deploy + Worker deploy are automated and reproducible

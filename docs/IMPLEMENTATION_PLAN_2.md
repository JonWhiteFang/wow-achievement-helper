# IMPLEMENTATION_PLAN_2.md — WoW Achievement Helper (Retail • EU)

This plan assumes the current repo layout:
- `apps/web` (React + Vite)
- `workers/api` (Cloudflare Worker)

It focuses on two things:
1) **Data completeness + correctness** (so the app feels “in‑game accurate”)
2) **A noticeably better UI scheme** (so it stops looking like a prototype)

---

## Key decisions (locked in for this plan)

### UI scheme: “Azeroth Dark” (recommended default)
A modern, Blizzard-adjacent dark UI with gold accents and subtle “panel” surfaces.

**Design tokens (CSS variables)**
- Background: very dark blue/gray
- Surfaces: layered slate panels
- Accent: muted gold for primary actions + selected states
- Status: green (completed), amber (in progress), red (errors)

**Layout**
- **Top bar:** search, filters, character context (guest/login), quick actions
- **3‑pane desktop:** Categories (left) • Achievements (center) • Details/Help drawer (right)
- **Mobile:** categories + drawer become slide‑in panels; list stays primary

### Data strategy
- Build and serve a **single “manifest”** from the Worker:
  - full category tree (nested)
  - achievement summaries (id, name, points, icon?, categoryId)
- Cache manifest in **KV** with a **24h server cache** and **ETag** for the client.
- Keep character progress calls “live-ish” (5m cache) but avoid breaking browser caching by not sending cookies unnecessarily.

### Help/strategy strategy
- Keep Wowhead comments as “community”, but add a **curated strategy provider** as first-class:
  - `workers/api/src/help/curated.ts` reads `workers/api/data/strategy/*.md|json`
  - community contribution via PRs (simple format)

---

## Phase 0 — Fix correctness + developer ergonomics (P0) ✅

### 0.1 Fix Worker type import path + tighten typecheck
**Why:** `workers/api/src/auth/session.ts` imports `Env` via `./env` (should be `../env`). This can break `tsc` and editor tooling.

**Tasks**
- Change `workers/api/src/auth/session.ts`:
  - `import type { Env } from "../env";`
- Replace root `typecheck` script with explicit workspace checks:
  - `npm run typecheck:web` and `npm run typecheck:worker`
- Add scripts:
  - root `package.json`
    - `typecheck:web`: `tsc -p apps/web/tsconfig.json`
    - `typecheck:worker`: `tsc -p workers/api/tsconfig.json`

**Acceptance**
- `npm run lint` and both typechecks pass locally and in CI.

### 0.2 Stop sending cookies on public endpoints (improves caching)
**Why:** `credentials: "include"` on *every* fetch makes caching worse and increases risk of “Vary: Cookie” behavior.

**Tasks (`apps/web/src/lib/api.ts`)**
- Use `credentials: "include"` only for:
  - `/auth/me`, `/auth/logout`, `/api/my/characters` (anything requiring session cookie)
- Use default fetch for:
  - `/api/categories`, `/api/achievement/:id`, `/api/help/achievement/:id`, `/api/character/...`

**Acceptance**
- Categories + achievements still load as guest.
- Login still works and character list loads.

---

## Phase 1 — Make browsing feel like the game (Full category tree + manifest) (P0) ✅

### 1.1 Worker: Build a full category tree + achievement index
**Current gap:** `fetchCategories()` only builds root categories and doesn’t fetch subcategories, so the “in‑game tree” is incomplete.

**Approach**
- Add a `buildManifest()` that:
  1. Fetches `/data/wow/achievement-category/index`
  2. Recursively fetches `/data/wow/achievement-category/{id}`
  3. Builds:
     - `categories: Category[]` (nested)
     - `achievements: AchievementSummary[]` (all categories)
- Add concurrency limiting (avoid stampedes).

**Implementation outline**
- `workers/api/src/blizzard/gameData.ts`
  - add `fetchAchievementCategory(env, id)` helper
  - add `buildCategoryTree(env, rootId)` recursive builder
- `workers/api/src/index.ts`
  - `/api/manifest` (new) → returns `{ categories, achievements, builtAt }`
  - `/api/categories` can remain but should just proxy `manifest.categories` for backwards compatibility

**Caching**
- KV key: `manifest:v1`
- Cache TTL:
  - KV: 24h (with “stale OK”)
  - Response headers: `Cache-Control: public, max-age=3600` + `ETag`

**Acceptance**
- Category tree has deep nesting (matches in-game structure broadly).
- Searching returns achievements beyond root categories.

### 1.2 Frontend: Switch to manifest loading (one fast request)
**Tasks**
- Replace initial `fetchCategories()` call with `fetchManifest()`
- Populate:
  - categories state from manifest
  - achievements state from manifest

**Acceptance**
- First load is faster (1 request vs many).
- UI still works with character progress overlay.

---

## Phase 2 — UI redesign (Azeroth Dark scheme) (P0/P1) ✅

### 2.1 Replace inline styles with a small design system
**Tasks**
- Add `apps/web/src/styles/theme.css`
  - CSS variables + base styles
- Add `apps/web/src/styles/components.css`
  - reusable classes for buttons, inputs, panels, badges
- Update `main.tsx` to import the CSS.

**Minimum token set**
- `--bg`, `--panel`, `--panel-2`, `--border`
- `--text`, `--muted`
- `--accent`, `--accent-2`
- `--success`, `--warning`, `--danger`

### 2.2 Layout: 3-pane desktop + mobile drawers
**Tasks**
- App layout refactor:
  - Left: collapsible Category panel
  - Center: Achievements list with sticky subheader (count, filter, sort)
  - Right: Drawer becomes a “sheet” panel that can be pinned open on desktop
- Replace `window.innerHeight` usage:
  - use a flex container + `height: 100%` list area OR add an AutoSizer

**Acceptance**
- Looks “intentional”: consistent spacing, borders, typography, hover states.
- Works on mobile (no horizontal scroll, panels accessible).

### 2.3 Achievement list row redesign
**Tasks**
- Each row shows:
  - completion indicator
  - achievement name
  - points
  - progress bar (if in-progress)
- Add sort:
  - Name
  - Points
  - Completion (incomplete first)

**Acceptance**
- Progress is readable at a glance.

### 2.4 Category tree UX
**Tasks**
- Expand/collapse nodes with chevrons
- Add breadcrumb display (selected path)
- Add “Recently visited” (last 5 categories) stored in localStorage

---

## Phase 3 — Help: make “Strategy” actually useful (P1)

### 3.1 Curated strategy provider (first-class)
**Tasks**
- Add `workers/api/data/strategy/README.md` describing format
- Add provider `curatedProvider` that:
  - reads per-achievement markdown/json by ID
  - returns `strategy: [{title, steps}]`
- Provider order: curated → wowhead comments (community)

**Acceptance**
- Some achievements show real steps in Strategy tab.
- Contribution path is clear (PR adds a file).

### 3.2 Improve Wowhead comment scraping resilience (optional)
**Tasks**
- Wrap parsing in stricter guards
- Add “Source unavailable” error shaping (don’t hard-fail the whole help payload)
- Ensure server-side cache is long enough to avoid repeat scraping bursts

---

## Phase 4 — Account-wide workflow polish (P1)

### 4.1 “Merge all my characters” button (logged in)
**Tasks**
- In CharacterSelector:
  - add “Select all level 70/80” (or “max level only”) toggle
  - add “Merge all” quick action
- Persist merge selection in localStorage (already present) + show as chips in header

### 4.2 Better refresh + token expiry handling
**Tasks**
- Worker:
  - detect expired access token in session
  - attempt refresh using refresh_token (if available) OR force re-login
- Frontend:
  - show a friendly banner when session expired

---

## Optional nice-to-haves (later)

- React Router deep links:
  - `/achievement/:id`, `/category/:id`, `?character=realm/name`
- React Query (TanStack Query) for caching + retries
- Playwright smoke test: “loads manifest + opens a drawer”
- Telemetry (Sentry) for Worker + frontend

---

## Proposed file-by-file change list (high level)

### `apps/web`
- `src/App.tsx` — layout refactor + manifest bootstrap
- `src/lib/api.ts` — add `fetchManifest()`, adjust credentials usage
- `src/components/*` — convert inline styles → classnames
- `src/styles/theme.css`, `src/styles/components.css` — new
- `index.html` — optional fonts (e.g., Inter + Cinzel from Google Fonts)

### `workers/api`
- `src/blizzard/gameData.ts` — recursive category + manifest builder
- `src/index.ts` — add `/api/manifest`, add ETag + KV caching
- `src/auth/session.ts` — fix `Env` import
- `src/help/curated.ts` + `data/strategy/*` — new provider + data

---

## Done definition (what “v2 improvements” means)

You’re “done” when:
- Category tree is deep and browseable (feels like in-game)
- Search hits achievements from *all* categories
- UI has a consistent dark scheme with gold accents and good spacing
- Strategy tab shows real actionable steps for at least a starter set of achievements
- Caching is sane (public endpoints don’t unnecessarily include cookies)

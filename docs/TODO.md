# TODO.md — WoW Achievement Helper

Remaining tasks and improvements not yet implemented.

---

## High Priority (UX Issues)

### 1. Realm selector should be a dropdown
**Current:** Free-text input for realm name (easy to mistype)
**Desired:** Dropdown with all EU realms fetched from Blizzard API

**Implementation:**
- Add `/api/realms` endpoint to worker that fetches from Blizzard's realm index
- Cache realm list in KV (rarely changes)
- Replace realm `<input>` in `CharacterLookup.tsx` with `<select>`

**Files:** `workers/api/src/index.ts`, `apps/web/src/components/CharacterLookup.tsx`

---

## Medium Priority (Polish)

### 2. Add more curated strategies
**Current:** Only 3 example achievements have curated strategies (7520, 2144, 40393)
**Desired:** Cover popular/difficult achievements

**Suggested achievements to add:**
- Glory of the Raider achievements
- Keystone Master achievements  
- What a Long, Strange Trip meta sub-achievements
- Exploration achievements with tricky locations
- PvP achievements with specific strategies

**Files:** `workers/api/src/data/strategy/*.json`

---

### 3. Achievement icons from Blizzard CDN
**Current:** No icons displayed
**Desired:** Show achievement icons in list and drawer

**Implementation:**
- Blizzard CDN URL format: `https://render.worldofwarcraft.com/eu/icons/56/{icon}.jpg`
- Add `icon` field to `AchievementSummary` type (already in Blizzard API response)
- Include icon in manifest build
- Display in `AchievementList.tsx` and `AchievementDrawer.tsx`

**Files:** `workers/api/src/blizzard/manifest.ts`, `apps/web/src/components/AchievementList.tsx`, `apps/web/src/components/AchievementDrawer.tsx`

---

### 4. Mobile responsive polish
**Current:** 3-pane layout doesn't adapt well to mobile
**Desired:** Responsive layout with slide-in panels

**Implementation:**
- Add CSS media queries for mobile breakpoints
- Category panel: slide-in drawer on mobile (toggle with ☰ button)
- Achievement drawer: full-screen overlay on mobile
- Adjust header to stack/wrap on narrow screens

**Files:** `apps/web/src/styles/theme.css`, `apps/web/src/App.tsx`

---

### 5. Keyboard navigation
**Current:** Mouse-only interaction
**Desired:** Full keyboard support

**Implementation:**
- Arrow keys to navigate achievement list
- Enter to open drawer
- Escape to close drawer
- Tab navigation through UI elements
- Focus indicators on interactive elements

**Files:** `apps/web/src/components/AchievementList.tsx`, `apps/web/src/App.tsx`

---

## Low Priority (Nice to Have)

### 6. Sentry full integration
**Current:** Prepared but not fully wired up
**Desired:** Full error tracking in production

**Implementation:**
- Create Sentry project and get DSN
- Set `VITE_SENTRY_DSN` env var for frontend
- Set `SENTRY_DSN` secret for worker
- Consider using `@sentry/cloudflare` properly with `withSentry` wrapper

**Files:** `apps/web/src/main.tsx`, `workers/api/src/index.ts`, deployment configs

---

### 7. Export/share progress
**Current:** No way to share or export
**Desired:** Share link or export to CSV

**Implementation:**
- Generate shareable URL with character info
- Export completed achievements to CSV
- Copy-to-clipboard for sharing

---

### 8. Pins and notes persistence
**Current:** Mentioned in AGENTS.md but not implemented
**Desired:** Pin achievements, add personal notes

**Implementation:**
- localStorage for pins/notes (per AGENTS.md "A mode")
- UI to pin/unpin achievements
- Notes field in drawer
- Filter to show pinned only

---

### 9. Progress statistics
**Current:** Just shows count
**Desired:** Show completion percentage, points earned

**Implementation:**
- Calculate total points possible vs earned
- Show percentage complete per category
- Overall account progress summary

---

## Deferred (Complex/Out of Scope)

### 10. Full Sentry Cloudflare Worker integration
The `@sentry/cloudflare` package requires specific setup with `withSentry` wrapper that had type issues. Currently using simple `console.error` logging instead.

### 11. React Query for all API calls
Currently only manifest uses React Query. Character lookups and help fetches still use raw fetch. Could be migrated for better caching/retry behavior.

---

## Completed ✅

- [x] Battle.net sign-in indicator (shows battletag when logged in)
- [x] Character selector for logged-in users ("My Characters" button)
- [x] Deep links with React Router
- [x] React Query for manifest
- [x] Playwright smoke tests
- [x] Curated strategy provider (basic)
- [x] Wowhead scraping resilience
- [x] Token refresh handling
- [x] Session expiry banner
- [x] Merge all max-level characters
- [x] Breadcrumbs and recent categories

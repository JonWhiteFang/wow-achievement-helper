# TODO.md — WoW Achievement Helper

Remaining tasks and improvements not yet implemented.

---

## High Priority (UX Issues)

*No high priority items remaining*

---

## Medium Priority (Polish)

*No medium priority items remaining*

---

## Low Priority (Nice to Have)

### 1. Sentry full integration
**Current:** Prepared but not fully wired up
**Desired:** Full error tracking in production

**Implementation:**
- Create Sentry project and get DSN
- Set `VITE_SENTRY_DSN` env var for frontend
- Set `SENTRY_DSN` secret for worker
- Consider using `@sentry/cloudflare` properly with `withSentry` wrapper

**Files:** `apps/web/src/main.tsx`, `workers/api/src/index.ts`, deployment configs

---

### 2. Export/share progress
**Current:** No way to share or export
**Desired:** Share link or export to CSV

**Implementation:**
- Generate shareable URL with character info
- Export completed achievements to CSV
- Copy-to-clipboard for sharing

---

### 3. Pins and notes persistence
**Current:** Mentioned in AGENTS.md but not implemented
**Desired:** Pin achievements, add personal notes

**Implementation:**
- localStorage for pins/notes (per AGENTS.md "A mode")
- UI to pin/unpin achievements
- Notes field in drawer
- Filter to show pinned only

---

### 4. Progress statistics
**Current:** Just shows count
**Desired:** Show completion percentage, points earned

**Implementation:**
- Calculate total points possible vs earned
- Show percentage complete per category
- Overall account progress summary

---

### 5. Dark/light theme toggle
**Current:** Dark theme only ("Azeroth Dark")
**Desired:** Optional light theme

**Implementation:**
- Add CSS variables for light theme
- Toggle button in header
- Persist preference in localStorage

---

### 6. Achievement comparison
**Current:** Single character view only
**Desired:** Compare progress between two characters side-by-side

**Implementation:**
- Add "Compare" mode
- Load two characters' progress
- Show diff view (what one has that other doesn't)

---

### 7. "What can I do now" smart filter
**Current:** Shows all incomplete achievements
**Desired:** Filter to achievements character can currently attempt

**Implementation:**
- Filter by character level requirements
- Filter by faction (Alliance/Horde specific)
- Exclude achievements requiring unavailable content

---

### 8. Wowhead link on each row
**Current:** Wowhead link only in drawer
**Desired:** Quick external link icon on list rows

**Implementation:**
- Add small external link icon to achievement rows
- Opens Wowhead in new tab without opening drawer
- Faster workflow for quick lookups

---

## Deferred (Complex/Out of Scope)

### 10. Full Sentry Cloudflare Worker integration
The `@sentry/cloudflare` package requires specific setup with `withSentry` wrapper that had type issues. Currently using simple `console.error` logging instead.

### 11. React Query for all API calls
Currently only manifest uses React Query. Character lookups and help fetches still use raw fetch. Could be migrated for better caching/retry behavior.

---

## Completed ✅

- [x] Reward filter (filter by title, mount, pet, toy, transmog rewards)
- [x] Meta achievement highlighting (visual badge + border, sub-achievement progress in list, clickable checklist in drawer)

- [x] "Account-wide only" toggle (filter to show only account-wide achievements)
- [x] Expansion filter (dropdown to filter by Classic, TBC, Wrath, etc.)
- [x] "Recently completed" list (last 20 achievements with completion dates in sidebar)
- [x] Category completion bars (recursive progress with bar + count + percentage)
- [x] Points display in header and section (earned/total)
- [x] "Near complete" filter (80%+ progress achievements)
- [x] Achievement icons from Blizzard CDN (list + drawer, with placeholder fallback). **Note:** Requires manifest rebuild after deploy via `/api/admin/build-manifest?reset=true`
- [x] Curated strategies for 10 more achievements (Glory raids, Keystone Master, exploration, PvP)
- [x] Mobile responsive layout (slide-in category drawer, full-screen achievement drawer)
- [x] Realm selector dropdown (fetches EU realms from Blizzard API, cached in KV)
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

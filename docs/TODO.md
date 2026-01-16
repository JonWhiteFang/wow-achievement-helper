# TODO.md — WoW Achievement Helper

Remaining tasks and improvements not yet implemented.

---

## High Priority (UX Issues)

*No high priority items remaining*

---

## Medium Priority (Polish)

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

## Medium Priority (Polish)

### 6. "Near complete" filter
**Current:** Only completed/incomplete filter
**Desired:** Filter showing achievements at 80%+ progress

**Implementation:**
- Add filter option "Near Complete"
- Calculate progress percentage from criteria
- Show achievements close to completion

---

### 7. Points display in header
**Current:** No points summary
**Desired:** Show total points earned vs possible (e.g., "12,450 / 28,000 pts")

**Implementation:**
- Calculate total points from manifest
- Calculate earned points from character progress
- Display in header next to character name

---

### 8. Category completion bars
**Current:** Categories show count only
**Desired:** Visual progress bars on category tree nodes

**Implementation:**
- Calculate % complete per category
- Add small progress bar to CategoryTree nodes
- Update on character progress load

---

### 9. "Recently completed" list
**Current:** No way to see recent completions
**Desired:** Show last 10-20 completed achievements

**Implementation:**
- Sort completed achievements by completion date (from API)
- Add "Recently Completed" smart list in category panel
- Show completion date in list

---

### 10. Expansion filter
**Current:** No expansion filtering
**Desired:** Filter by expansion (Classic, TBC, Wrath, etc.)

**Implementation:**
- Map category IDs to expansions
- Add expansion dropdown filter
- Filter achievement list by selected expansion

---

### 11. "Account-wide only" toggle
**Current:** Shows all achievements
**Desired:** Filter to show only account-wide achievements

**Implementation:**
- Use `isAccountWide` field from achievement data
- Add toggle in filter bar
- Useful for alt players focusing on account progress

---

### 12. Meta achievement highlighting
**Current:** Meta achievements look like regular achievements
**Desired:** Visual distinction + show sub-achievement progress inline

**Implementation:**
- Detect meta achievements (have child achievement criteria)
- Add visual badge/border for metas
- Show "3/8 sub-achievements" progress

---

### 13. Reward filter
**Current:** No reward filtering
**Desired:** Filter by reward type (title, mount, pet, transmog)

**Implementation:**
- Parse reward field from achievement data
- Add reward type filter pills
- Popular for collectors

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

### 14. Dark/light theme toggle
**Current:** Dark theme only ("Azeroth Dark")
**Desired:** Optional light theme

**Implementation:**
- Add CSS variables for light theme
- Toggle button in header
- Persist preference in localStorage

---

### 15. Achievement comparison
**Current:** Single character view only
**Desired:** Compare progress between two characters side-by-side

**Implementation:**
- Add "Compare" mode
- Load two characters' progress
- Show diff view (what one has that other doesn't)

---

### 16. "What can I do now" smart filter
**Current:** Shows all incomplete achievements
**Desired:** Filter to achievements character can currently attempt

**Implementation:**
- Filter by character level requirements
- Filter by faction (Alliance/Horde specific)
- Exclude achievements requiring unavailable content

---

### 17. Wowhead link on each row
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

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

### 1. Achievement comparison
**Current:** Single character view only
**Desired:** Compare progress between two characters side-by-side

**Implementation:**
- Add "Compare" mode
- Load two characters' progress
- Show diff view (what one has that other doesn't)

---

### 2. "What can I do now" smart filter
**Current:** Shows all incomplete achievements
**Desired:** Filter to achievements character can currently attempt

**Implementation:**
- Filter by character level requirements
- Filter by faction (Alliance/Horde specific)
- Exclude achievements requiring unavailable content

---

## Deferred (Complex/Out of Scope)

### React Query for all API calls
Currently only manifest uses React Query. Character lookups and help fetches still use raw fetch. Could be migrated for better caching/retry behavior.

---

## Completed ✅

- [x] Sentry full integration (withSentry wrapper for worker, frontend already configured)
- [x] Export/share progress (clipboard share + CSV export)
- [x] Pins and notes persistence (localStorage with filter)
- [x] Progress statistics (completion %, points breakdown)
- [x] Dark/light theme toggle (with localStorage persistence)
- [x] Wowhead link on each row (external link icon with hover effect)
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

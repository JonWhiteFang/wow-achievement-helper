# UX_SPEC.md

## Core UX Principles

- "Feels like WoW achievements" but more modern:
  - faster search
  - better filters
  - richer help panel
- Instant navigation:
  - render from cached catalogue first
  - overlay completion/progress when it arrives
- Clear mode separation:
  - Guest mode: one character lookup
  - Logged-in mode: account selector + alt merge

## UI Theme: "Azeroth Dark"

A modern, Blizzard-adjacent dark UI with gold accents.

**Design tokens (CSS variables in `theme.css`)**
- `--bg`: very dark blue/gray background
- `--panel`, `--panel-2`: layered slate surfaces
- `--accent`, `--accent-2`: muted gold for primary actions
- `--success`: green (completed)
- `--warning`: amber (in progress)
- `--danger`: red (errors)

## Primary Screens

### 1) Home / Landing

Elements:

- EU-only indicator
- Character lookup:
  - Realm selector dropdown (fetches from `/api/realms`)
  - Character name input
- CTA: "Sign in with Battle.net"
- Recent characters (local)

### 2) Achievements (Main Workspace)

3-panel desktop layout with 3 view modes:

**View Modes:**
- **Single**: View one character's progress
- **Merged**: Combined progress across selected characters
- **Compare**: Side-by-side comparison of two characters

3-panel desktop layout:

**Top bar**

- Character selector (guest: current char; logged-in: merged or single)
- ⚔️ Compare button (when logged in, opens comparison mode)
- Global search input (fuzzy search via Fuse.js)
- Filter pills:
  - All / Completed / Incomplete / Near Complete (80%+) / Pinned
- Compare filter (when in compare mode):
  - Only A / Only B / Both / Neither
- Sort dropdown:
  - Name / Points / Completion
- Expansion filter dropdown:
  - All / Classic / TBC / Wrath / Cata / MoP / WoD / Legion / BfA / Shadowlands / Dragonflight / War Within
- Reward filter dropdown:
  - All / Title / Mount / Pet / Toy / Transmog / Other
- Account-wide only toggle
- ☀️/🌙 Theme toggle (dark/light mode)
- Export/share buttons:
  - 📋 Copy share link
  - 📥 Export to CSV
- Points display: "X / Y pts" (earned / total for current view)
- Battletag display (when logged in)
- "My Characters" button (when logged in)

**Left panel: Category Tree**

- Expand/collapse with chevrons (▶/▼)
- Breadcrumb display (selected path)
- Recent categories section (last 5, localStorage)
- "Recently Completed" virtual category (last 20 achievements by completion date)
- Category completion bars showing:
  - Progress bar (visual)
  - Count: "X / Y"
  - Percentage: "(Z%)"

**Center panel: Achievement List**

- Virtualized list (react-window) for performance
- Each row shows:
  - Achievement icon (from Blizzard CDN, with placeholder fallback)
  - Completion indicator (✓ green, progress bar amber, empty gray)
  - Achievement name
  - Points badge
  - Progress bar if incomplete with criteria progress

**Right drawer: Achievement Detail**

Tabbed:

- Overview (description, reward, points, category breadcrumb, icon)
- Criteria (checklist with progress indicators)
- Strategy (curated steps from providers)
- Community (top comments from Wowhead)

Actions:

- Refresh (re-fetch progress/help content)
- "Open on Wowhead" link (always present)

### 3) Logged-in Character Selector Modal

- Shows character list from `/api/me/characters`
- Quick picks:
  - "Select all max level" toggle
- Manual selection with checkboxes
- Save selection locally (not server-side)
- Output view label:
  - "Merged view (N characters)"

## Key Interactions

- Search:
  - Fuzzy search over local index (Fuse.js)
  - Filtering is instant client-side
  - Debounced input (500ms)
- Category selection:
  - Updates list to achievements under that category (and descendants)
  - Updates breadcrumb
  - Adds to recent categories
- Achievement click:
  - Opens right drawer
  - Fetches `/api/achievement/:id` if not cached
  - Fetches `/api/help/achievement/:id?top=10`
- Deep linking:
  - `/#/achievement/:id` opens drawer directly
  - `/#/category/:id` selects category
  - `?character=realm/name` loads character progress

## Filters and Sorting

**Filter options:**
- All: Show all achievements
- Completed: Show only completed achievements
- Incomplete: Show only incomplete achievements
- Near Complete: Show achievements with 80%+ criteria progress

**Sort options:**
- Name: Alphabetical A-Z
- Points: Highest points first
- Completion: Completed first, then by progress percentage

**Expansion filter:**
- Maps categories to expansions based on category hierarchy
- Client-side filtering using `buildCategoryExpansionMap`

## Points Display

- Header shows: "X / Y pts" for current filtered view
- X = sum of points for completed achievements
- Y = sum of points for all achievements in view
- Updates dynamically with filters

## Recently Completed

- Virtual category in left panel
- Shows last 20 achievements completed (by timestamp)
- Only visible when character progress is loaded
- Sorted by completion date (newest first)
- Shows completion date in list

## Achievement Icons

- Loaded from Blizzard CDN: `https://render.worldofwarcraft.com/eu/icons/56/{icon}.jpg`
- Placeholder shown on load failure
- Icons included in manifest data

## Client-side Storage

Local-only (localStorage):
- Saved characters (guest)
- Merge selection (logged-in)
- Recent categories (last 5)
- Pinned achievement IDs
- Achievement notes (per achievement)
- Theme preference (dark/light)

## Error States

All views handle:
- Loading (skeleton/spinner)
- Empty result ("No achievements found")
- Error state (retry button)
- Partial data (catalogue loaded, overlay still loading)
- Session expired (banner with re-login prompt)

## Responsive Design

**Desktop (>768px):**
- 3-pane layout: category tree | achievement list | detail drawer
- All panels visible simultaneously

**Mobile (≤768px):**
- Category panel: slide-in drawer (toggle button in header)
- Achievement list: full width
- Achievement drawer: full-screen overlay with close button
- Header elements stack/collapse as needed
- Touch-friendly tap targets

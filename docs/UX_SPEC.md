# UX_SPEC.md

## Core UX Principles

- “Feels like WoW achievements” but more modern:
  - faster search
  - better filters
  - richer help panel
  - pinned workspace + notes
- Instant navigation:
  - render from cached catalogue first
  - overlay completion/progress when it arrives
- Clear mode separation:
  - Guest mode: one character lookup
  - Logged-in mode: account selector + alt merge

## Primary Screens

### 1) Home / Landing

Elements:

- EU-only indicator
- Character lookup:
  - Realm (slug or human; with autocomplete)
  - Character name
- CTA: “Sign in with Battle.net”
- Recent characters (local)

### 2) Achievements (Main Workspace)

3-panel desktop layout:

**Top bar**

- Character selector (guest: current char; logged-in: merged or single)
- Global search input (achievement name + keywords)
- Quick filter pills:
  - Incomplete / Completed
  - Pinned
  - Meta
  - Reward
  - Expansion (dropdown)

**Left panel: Category Tree**

- Expand/collapse
- Smart lists:
  - Pinned
  - Near-complete (>= 80%)
  - Recently completed
- Shows counts (e.g., incomplete in category)

**Center panel: Achievement List**

- Virtualized list for performance
- Each row:
  - icon
  - name
  - points
  - completion check + date
  - progress bar if incomplete
  - tags (Account-wide, Meta, Reward, PvP, Dungeon/Raid)

**Right drawer: Achievement Detail**

Tabbed:

- Overview (description, reward, points, category breadcrumb)
- Criteria (checklist with progress)
- Strategy (provider content; step lists)
- Community (top 5–10 useful comments)
- Notes (local markdown notes)

Actions:

- Pin/unpin
- Refresh (re-fetch progress/help content)
- “Open on Wowhead” link (always)

### 3) Logged-in Character Merge Modal

- Shows character list from `/api/me/characters`
- Quick picks:
  - Main only
  - Main + last 5 played (optional)
  - Select manually
- Save selection locally (not server-side)
- Output view label:
  - “Merged account view (N characters)”

## Key Interactions

- Search:
  - fuzzy search over local index
  - filtering is instant client-side
- Category selection:
  - updates list to achievements under that category (and optionally descendants)
- Achievement click:
  - opens right drawer
  - fetches `/api/achievement/:id` if not cached
  - fetches `/api/help/achievement/:id?top=10`

## Client-side Storage

Local-only:
- saved characters (guest)
- merge selection (logged-in)
- pinned achievements
- notes per achievement
- recent searches

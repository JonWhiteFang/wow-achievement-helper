# UX_SPEC.md

## Core UX Principles

- "Feels like WoW achievements" but more modern:
  - faster search
  - better filters
  - richer help panel
  - pinned workspace + notes (planned)
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
  - Realm (text input, TODO: dropdown)
  - Character name
- CTA: "Sign in with Battle.net"
- Recent characters (local)

### 2) Achievements (Main Workspace)

3-panel desktop layout:

**Top bar**

- Character selector (guest: current char; logged-in: merged or single)
- Global search input (fuzzy search via Fuse.js)
- Filter pills:
  - Completed / Incomplete / All
- Battletag display (when logged in)
- "My Characters" button (when logged in)

**Left panel: Category Tree**

- Expand/collapse with chevrons
- Breadcrumb display (selected path)
- Recent categories (last 5, localStorage)
- Shows counts (e.g., incomplete in category)

**Center panel: Achievement List**

- Virtualized list (react-window) for performance
- Each row:
  - completion indicator (✓ or progress)
  - achievement name
  - points
  - progress bar if incomplete

**Right drawer: Achievement Detail**

Tabbed:

- Overview (description, reward, points, category breadcrumb)
- Criteria (checklist with progress)
- Strategy (curated steps from providers)
- Community (top comments from Wowhead)

Actions:

- Refresh (re-fetch progress/help content)
- "Open on Wowhead" link (always)

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
  - fuzzy search over local index (Fuse.js)
  - filtering is instant client-side
- Category selection:
  - updates list to achievements under that category (and descendants)
  - updates breadcrumb
- Achievement click:
  - opens right drawer
  - fetches `/api/achievement/:id` if not cached
  - fetches `/api/help/achievement/:id?top=10`
- Deep linking:
  - `/#/achievement/:id` opens drawer directly
  - `/#/category/:id` selects category

## Client-side Storage

Local-only (localStorage):
- saved characters (guest)
- merge selection (logged-in)
- recent categories
- recent searches

Planned (see TODO.md):
- pinned achievements
- notes per achievement

## Error States

All views handle:
- Loading (skeleton/spinner)
- Empty result ("No achievements found")
- Error state (retry button)
- Partial data (catalogue loaded, overlay still loading)
- Session expired (banner with re-login prompt)

## Responsive Design

Current:
- 3-pane layout on desktop
- Basic mobile support

Planned (see TODO.md):
- Category panel: slide-in drawer on mobile
- Achievement drawer: full-screen overlay on mobile
- Header stacking on narrow screens

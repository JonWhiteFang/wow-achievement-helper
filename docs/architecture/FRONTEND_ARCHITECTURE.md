# Frontend Architecture

This document describes the architecture of the React frontend in `apps/web/`.

## File Structure

```
apps/web/src/
├── main.tsx              # Entry point, React Query provider, Router
├── App.tsx               # Main application component (all state + routing)
├── vite-env.d.ts         # Vite environment types
├── components/
│   ├── AchievementDrawer.tsx   # Right panel detail view
│   ├── AchievementList.tsx     # Virtualized achievement list
│   ├── AuthButton.tsx          # Login/logout button
│   ├── CategoryTree.tsx        # Left panel category navigation
│   ├── CharacterLookup.tsx     # Realm/character input form
│   ├── CharacterSelector.tsx   # Modal for selecting characters to merge
│   └── ErrorBoundary.tsx       # Error boundary wrapper
├── lib/
│   ├── api.ts            # API client (all backend calls)
│   ├── categoryStats.ts  # Category completion calculations
│   ├── dates.ts          # Date formatting utilities
│   ├── expansions.ts     # Expansion mapping for categories
│   ├── points.ts         # Points calculation utilities
│   ├── search.ts         # Fuse.js search hook
│   └── storage.ts        # localStorage helpers
└── styles/
    ├── theme.css         # CSS variables (colors, spacing)
    └── components.css    # Component styles
```

## Component Responsibilities

### `App.tsx`

The main application component containing:

- All application state (character progress, auth, filters, etc.)
- React Router route definitions
- Data fetching orchestration
- Event handlers for user interactions

Key state:
- `charProgress` / `mergeResult`: Character achievement data
- `viewMode`: "single" or "merged"
- `filter`: "all" | "completed" | "incomplete" | "near"
- `sort`: "name" | "points" | "completion"
- `expansion`: Expansion filter value
- `auth`: Authentication status
- `recentCategories`: Recently viewed categories

### `CategoryTree.tsx`

Left panel showing:
- Nested category tree with expand/collapse
- Completion bars per category
- Recent categories section
- "Recently Completed" virtual category

Props: categories, selected category, completion data, handlers

### `AchievementList.tsx`

Center panel showing:
- Virtualized list of achievements (react-window)
- Achievement rows with icon, name, points, progress
- Click handler to open drawer

Props: achievements, completion data, selected achievement, handlers

### `AchievementDrawer.tsx`

Right panel showing:
- Achievement details (description, points, reward)
- Criteria checklist with progress
- Strategy tab (from help API)
- Community tab (from help API)
- Wowhead link

Props: achievement ID, completion data, onClose

### `CharacterLookup.tsx`

Form for guest character lookup:
- Realm selector dropdown (fetches from `/api/realms`)
- Character name input
- Submit handler

### `CharacterSelector.tsx`

Modal for logged-in users:
- List of user's characters from `/api/me/characters`
- Checkboxes for selection
- "Select all max level" quick action
- Confirm to trigger merge

### `AuthButton.tsx`

Simple login/logout button showing battletag when logged in.

## State Management

### Server State (React Query)

```typescript
const { data: manifest } = useQuery({
  queryKey: ["manifest"],
  queryFn: fetchManifest,
});
```

React Query handles:
- Caching the manifest
- Loading/error states
- Background refetching

### Local State (useState)

UI state managed with React hooks:
- Selected category/achievement
- Filter/sort/expansion values
- Character progress data
- Modal open/close states

### Persistent State (localStorage)

Via `lib/storage.ts`:
- `getSavedCharacter()` / `saveCharacter()`: Last looked-up character
- `getMergeSelection()` / `saveMergeSelection()`: Selected characters for merge
- `getRecentCategories()` / `addRecentCategory()`: Recent category history

## Routing

Hash routing for GitHub Pages compatibility:

```typescript
<HashRouter>
  <Routes>
    <Route path="/" element={<AppContent />}>
      <Route path="category/:categoryId" element={null} />
      <Route path="category/:categoryId/achievement/:achievementId" element={null} />
      <Route path="achievement/:achievementId" element={null} />
    </Route>
  </Routes>
</HashRouter>
```

Route params extracted via `useParams()` and used to control UI state.

Query params:
- `?character=realm/name`: Auto-load character progress on page load

## API Client (`lib/api.ts`)

Centralized API calls with types:

```typescript
const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchManifest(): Promise<ManifestResponse> { ... }
export async function fetchAchievement(id: number): Promise<Achievement> { ... }
export async function fetchCharacterAchievements(realm: string, name: string): Promise<CharacterProgress> { ... }
export async function fetchAuthStatus(): Promise<AuthStatus> { ... }
export async function fetchMyCharacters(): Promise<WowCharacter[]> { ... }
export async function mergeCharacters(characters: ...): Promise<MergeResult> { ... }
export async function fetchRealms(): Promise<Realm[]> { ... }
export async function fetchHelp(achievementId: number, top?: number): Promise<HelpPayload> { ... }
```

All authenticated endpoints use `credentials: "include"` for cookie-based auth.

## Performance Optimizations

### List Virtualization

Achievement list uses `react-window` to render only visible rows:

```typescript
<FixedSizeList
  height={containerHeight}
  itemCount={achievements.length}
  itemSize={48}
>
  {Row}
</FixedSizeList>
```

### Client-side Search

Fuse.js for fuzzy search over local data:

```typescript
const { results } = useSearch(achievements, searchQuery, ["name"]);
```

No server round-trips for search.

### Memoization

Expensive computations memoized:

```typescript
const categoryExpansionMap = useMemo(
  () => buildCategoryExpansionMap(categories),
  [categories]
);
```

## Environment Configuration

`.env.development`:
```
VITE_API_BASE=http://localhost:8787
```

`.env.production`:
```
VITE_API_BASE=https://wow-achievement-helper-api.jono2411.workers.dev
```

## Build Output

Vite builds to `apps/web/dist/` with:
- `base: "/wow-achievement-helper/"` for GitHub Pages
- Hash-based chunk names for caching

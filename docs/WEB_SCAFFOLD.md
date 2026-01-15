# WEB_SCAFFOLD.md

This document specifies a modern React/Vite/TypeScript frontend scaffold for:

- GitHub Pages hosting
- Achievements browsing (category tree + list + detail drawer)
- Guest character lookup overlay
- Battle.net login UX
- Account-wide (merged) view selection
- Help panel tabs (Strategy + Community)

---

## Frontend: Files & Responsibilities

```
apps/web/
  index.html
  vite.config.ts
  package.json
  src/
    main.tsx
    app/App.tsx
    app/router.tsx
    app/layout/
      Shell.tsx
      TopBar.tsx
      LeftNav.tsx
      AchievementList.tsx
      AchievementDrawer.tsx
    features/auth/
      authApi.ts
      authStore.ts
      LoginButton.tsx
    features/catalog/
      catalogApi.ts
      catalogStore.ts
      categoryTree.ts
      searchIndex.ts
    features/character/
      characterApi.ts
      characterStore.ts
      CharacterLookup.tsx
      MergeModal.tsx
      mergeLogic.ts
    features/help/
      helpApi.ts
      HelpTabs.tsx
    lib/
      http.ts
      storage.ts
      types.ts
```

---

## Routing

Use hash routing for GitHub Pages simplicity.

Routes:
- `/#/` Home
- `/#/achievements` Workspace
- `/#/achievements/:achievementId` Deep-link opens drawer

---

## State Management

Recommended: Zustand.

Persist locally:
- saved characters
- merge selection
- pins
- notes

---

## API client (`src/lib/http.ts`)

- Send `credentials: "include"` so Worker session cookie works.
- Centralize error mapping.

---

## Layout: 3-panel shell

- Top bar: search + filters + view selector
- Left: category tree + smart lists
- Center: virtualized achievement list
- Right: achievement drawer with tabs

---

## Drawer tabs

- Overview
- Criteria
- Strategy
- Community
- Notes

---

## Account-wide (merged) UX

- “Merge” opens modal
- Modal loads `/api/me/characters`
- Confirm triggers `/api/me/merge`
- Overlay stored in character store

---

## GitHub Pages notes

- Vite `base` set to `/<repo-name>/`
- Hash router avoids 404 on refresh

---

## Environment

Environment files:
- `.env.development`: `VITE_API_BASE=http://localhost:8787`
- `.env.production`: `VITE_API_BASE=https://wow-achievement-helper-api.jono2411.workers.dev`

Type definitions in `src/vite-env.d.ts`.

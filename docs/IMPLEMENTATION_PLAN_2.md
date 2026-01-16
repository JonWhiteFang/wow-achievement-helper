# IMPLEMENTATION_PLAN_2.md — WoW Achievement Helper (Retail • EU)

## Status: ✅ Complete

All items from this plan have been implemented and merged into the main `IMPLEMENTATION_PLAN.md`.

This file is kept for historical reference.

---

## Summary of Completed Work

### Phase 0 — Fix correctness + developer ergonomics ✅
- Fixed Worker type import paths
- Separated typecheck scripts for web and worker
- Stopped sending cookies on public endpoints

### Phase 1 — Full category tree + manifest ✅
- Built `/api/manifest` endpoint with full nested category tree
- Incremental manifest builder with scheduled worker
- Frontend switched to manifest loading (single request)

### Phase 2 — UI redesign (Azeroth Dark scheme) ✅
- CSS variables design system (`theme.css`, `components.css`)
- 3-pane desktop layout
- Achievement list with completion indicators
- Category tree with expand/collapse, breadcrumbs, recent categories

### Phase 3 — Help: curated strategy provider ✅
- Curated strategy provider reading from JSON files
- Wowhead comment scraping with resilience
- Provider fallback chain

### Phase 4 — Account-wide workflow polish ✅
- "Select all max level" quick action
- Token refresh handling
- Session expiry banner

### Optional nice-to-haves ✅
- React Router deep links
- React Query for manifest
- Playwright smoke tests

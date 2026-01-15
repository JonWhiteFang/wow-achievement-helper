# AGENTS.md — Wow Achievement Helper

This repository contains a World of Warcraft (Retail, EU-only) achievement helper:

- **Frontend:** React + Vite + TypeScript deployed to **GitHub Pages**
- **Backend:** **Cloudflare Worker** (TypeScript) for Blizzard API proxy + Battle.net OAuth + help-provider aggregation
- **Local-only user data:** pins/notes/saved characters are stored in the browser (no server-side user content)

This document defines how AI coding agents should work in this repo: scope, rules, conventions, and “definition of done”.

---

## 0) Prime directive

**Treat correctness, security, and stability as first-class requirements.**

Specifically:

- Never expose Blizzard/Battle.net secrets to the browser.
- Never store user tokens client-side.
- Never render untrusted HTML from external providers without strict sanitization.
- Keep EU-only behavior consistent end-to-end.

---

## 1) First action for any task: assess + clarify (agent behavior)

Before making changes, the agent must do a **30–90 second assessment**:

1) Identify what area the change touches:
   - `apps/web` (frontend)
   - `workers/api` (worker backend)
   - shared types/utilities
   - CI/deployment
   - docs/specs

2) Determine if any uncertainty blocks correct implementation.

### Clarifying questions rule

Ask clarifying questions **only when the task is genuinely ambiguous** and the ambiguity would cause incorrect behavior. If not ambiguous, proceed.

**If you do ask questions:**
- Ask at most 3 questions.
- Provide a recommended default path so work can proceed even without answers.

### Mandatory self-check before code

The agent must write (in its own planning) a short checklist:

- security implications
- caching implications
- error handling states
- UI states (loading/empty/error/partial data)
- whether docs/specs need updating

---

## 2) Canonical specs (source of truth)

When implementing features, follow these documents (in order of priority):

1) `docs/API_SPEC.md` — endpoint shapes and error conventions
2) `docs/UX_SPEC.md` — UI behaviors/layout expectations
3) `docs/ARCHITECTURE.md` — flows, caching, security model
4) `docs/HELP_PROVIDERS.md` — provider adapter contract
5) `docs/IMPLEMENTATION_PLAN.md` — sequencing and milestones
6) `docs/WORKER_SKELETON.md` / `docs/WEB_SCAFFOLD.md` / `docs/CI_AND_DEPLOYMENT.md` — scaffolding guidance

If you must deviate, **update the relevant docs in the same PR**.

---

## 3) Repo structure

Expected layout:

- `apps/web/` — React/Vite frontend (GH Pages)
- `workers/api/` — Cloudflare Worker backend
- `packages/core/` — shared types/utilities (optional; add only if it reduces duplication)
- `docs/` — design + implementation specifications

Keep responsibilities separated:

- UI logic stays in `apps/web`
- OAuth, secrets, provider fetching stays in `workers/api`

---

## 4) Key constraints and non-negotiables

### Region / game version
- **Retail only**
- **EU only** (all Blizzard calls must use EU endpoints/namespaces)

### Hosting model
- Frontend must remain a **static** site deployable to GitHub Pages.
- Backend must remain a **serverless** Worker (no always-on servers).

### User data model (“A mode”)
- No server-side user-generated content.
- Pins/notes/saved characters are stored locally (localStorage/IndexedDB).

### Third-party strategy/community content
- Implement a **provider fallback** system.
- Always provide a **deep link** to Wowhead even if provider parsing fails.
- Never rely on a single provider being stable forever.

### Security
- Never put client secrets in the frontend.
- Use HTTPOnly cookies for sessions.
- Enforce strict CORS to GH Pages origin.
- Sanitize provider content; prefer returning plain text.

---

## 5) Development workflow expectations

### Branching / PR etiquette
- Small, reviewable PRs preferred.
- Each PR should include:
  - what changed
  - how to test
  - screenshots for UI changes (if feasible)

### Commit style
Use clear, scoped messages:

- `web: add achievement drawer tabs`
- `worker: implement /api/me/characters`
- `docs: update API error codes`

### “No silent breakage”
If you change:
- endpoint response shape → update `docs/API_SPEC.md`
- UI behavior → update `docs/UX_SPEC.md`
- auth/session rules → update `docs/ARCHITECTURE.md`

---

## 6) Backend (Cloudflare Worker) rules

### Required patterns
- Centralized JSON response helpers
- Centralized error helper with shape:
  ```json
  { "error": "CODE", "message": "Human readable", "details": { } }
  ```
- `credentials: include` compatible (cookie-based session)
- Strict CORS allowlist (exact GH Pages origin)

### Caching rules (baseline)
- Game Data (categories/achievement definitions): **24h+** with SWR
- Profile/character achievements: **short** (30s–5m)
- Help content: **6–24h**
- Always allow a client “Refresh” path (revalidate or bypass cache)

### Session rules
- Session cookie stores only opaque `session_id`
- KV stores token record keyed by session id
- Never log tokens
- If refresh tokens exist, refresh server-side; otherwise re-auth gracefully

### Rate limiting and abuse
Minimum:
- constrain concurrency for merge calls (fetch characters in small batches)
- return `RATE_LIMITED` on upstream throttling
- avoid unbounded fan-out

### Provider safety
- Parse and return **plain text** by default.
- If any HTML is returned, it must be sanitized with a strict allowlist approach.

---

## 7) Frontend (React/Vite) rules

### UX fundamentals
- Render from cached catalogue quickly, then overlay completion/progress.
- UI must handle:
  - loading
  - empty result
  - error state
  - partial data (catalogue loaded, overlay still loading)

### Performance
- Expect many achievements. Use list virtualization for the main list.
- Keep search local (Fuse or similar), not server-dependent.

### Storage
Local-only:
- saved characters
- merge selections
- pins
- notes
- recent searches

Do not store OAuth tokens.

### Routing
Prefer hash routing for GitHub Pages stability:
- `/#/`
- `/#/achievements`
- `/#/achievements/:id` (deep link to drawer)

---

## 8) Implementation order (agent should follow)

Follow the phases defined in `docs/IMPLEMENTATION_PLAN.md`. Mark tasks as complete (`[x]`) once done.

- [x] **Phase 0 — Project Bootstrap:** monorepo structure, tooling, CI, Cloudflare setup
- [x] **Phase 1 — Blizzard Game Data Catalogue:** Worker endpoints + frontend tree/list/drawer
- [ ] **Phase 2 — Guest Character Lookup Overlay:** character lookup endpoint + UI overlay
- [ ] **Phase 3 — Battle.net Login:** OAuth flow + `/api/me/characters`
- [ ] **Phase 4 — Account-Wide Merge:** merge endpoint + merge UI
- [ ] **Phase 5 — Help Panel:** provider adapter system + strategy/community tabs
- [ ] **Phase 6 — Polish, Performance, Quality:** fuzzy search, smart lists, virtualization, observability

If asked to "build everything," follow this order and land incremental PRs.

---

## 9) Testing and quality gates

### Worker tests (minimum expectations)
- token caching logic
- session creation/validation
- merge logic correctness
- help-provider normalization output shape

### Web tests (minimum expectations)
- filtering/search logic
- drawer open/close + tab behavior
- error state rendering

### CI expectations
- `lint` must pass
- `typecheck` must pass
- `build` must pass
- Deploy workflow must not be broken

If a task adds meaningful new logic, add at least one test.

---

## 10) Definition of done (per task)

A task is “done” only when:

- It compiles and passes typecheck
- It matches existing specs (or specs are updated)
- It handles errors gracefully
- It does not weaken security
- It includes brief “how to test” notes (PR description or final message)

---

## 11) Agent output format expectations

When producing work, the agent should provide:

1) What it changed (bulleted)
2) Where it changed (file list)
3) How to test locally
4) Follow-ups / known limitations

Avoid verbose essays; be actionable.

---

## 12) Quick “how to run” (agent should maintain)

> Update these commands if the repo scripts differ.

### Web
- `cd apps/web`
- `npm install`
- `npm run dev`

### Worker
- `cd workers/api`
- `npm install`
- `wrangler dev`

---

## 13) Common pitfalls to avoid

- Putting OAuth secrets in frontend env vars
- Relying on a single provider being stable (must fallback)
- Returning provider HTML without sanitization
- Making catalogue/search server-dependent for every keystroke
- Fetching too many character achievement payloads in parallel (merge must throttle)
- Weak CORS policy (must lock to GH Pages origin)

---

## 14) Agent Task Template

Use this template as the *default* structure for any agent-driven task. It’s designed to be pasted into an agent prompt or a PR description.

### 14.1 Task header

- **Task:** <one sentence>
- **Area:** (web | worker | both | docs | CI)
- **Risk level:** (low | medium | high)
- **User-visible change:** (yes | no)
- **Spec touchpoints:** (API_SPEC / UX_SPEC / ARCHITECTURE / HELP_PROVIDERS / IMPLEMENTATION_PLAN)

### 14.2 Pre-flight checklist (must complete before coding)

- [ ] Identify impacted endpoints/components
- [ ] Security review (secrets/tokens/cookies/CORS/sanitization)
- [ ] Caching review (TTL/SWR, bypass/refresh path)
- [ ] Error states (network errors, upstream errors, empty states)
- [ ] Performance considerations (virtualization/search index)
- [ ] Backwards compatibility (API shapes, stored local state)
- [ ] Update docs if needed

### 14.3 Implementation plan (short)

1) <step>
2) <step>
3) <step>

### 14.4 Acceptance criteria (concrete)

- [ ] <user-observable outcome>
- [ ] <API response shape unchanged OR doc updated>
- [ ] <security invariant maintained>
- [ ] <tests added/updated as appropriate>

### 14.5 “How to test” script (copy/paste)

Provide both:

**Local dev:**
- Web: `cd apps/web && npm i && npm run dev`
- Worker: `cd workers/api && npm i && wrangler dev`

**Manual verification steps:**
1) …
2) …
3) …

### 14.6 Post-change summary (required in final response)

- **Changed files:** <list>
- **What changed:** <bullets>
- **How to test:** <bullets>
- **Known limitations:** <bullets>

---

## 15) Agent Prompt (copy/paste)

Paste the block below into your AI coding agent when you want consistent results.

> **Agent prompt begins**
>
> You are working in the “Wow Achievement Helper” repository. Follow `AGENTS.md` strictly.
>
> **Rules:**
> - Prefer smallest safe changes.
> - No client secrets in frontend.
> - Use HTTPOnly session cookies; tokens stay server-side.
> - Enforce strict CORS to the GitHub Pages origin.
> - Provider content must be sanitized; prefer plain text.
> - Follow `docs/API_SPEC.md` response shapes. If you change them, update the docs.
>
> **Your output must include:**
> 1) A short plan using the Task Template sections 14.1–14.4
> 2) A file-by-file change list (paths)
> 3) The implementation (code)
> 4) “How to test” steps
>
> **Task:**
> <PASTE TASK HERE>
>
> **Definition of done:**
> - Typecheck + build succeed
> - Errors handled
> - Security invariants maintained
> - Docs updated if needed
>
> **Agent prompt ends**

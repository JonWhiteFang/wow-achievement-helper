# Architecture Decisions

Record of key technical decisions and their rationale.

---

## ADR-001: Cloudflare Workers for Backend

**Decision:** Use Cloudflare Workers instead of traditional server or AWS Lambda.

**Rationale:**
- Free tier generous for this use case
- KV storage built-in for sessions/caching
- Edge deployment = low latency globally
- No cold start issues like Lambda
- Simple deployment via Wrangler

**Trade-offs:**
- 10ms CPU limit per request (mitigated by caching)
- No persistent connections
- Limited to JavaScript/TypeScript

---

## ADR-002: GitHub Pages for Frontend

**Decision:** Static hosting on GitHub Pages instead of Vercel/Netlify.

**Rationale:**
- Free, reliable hosting
- Integrated with repo (auto-deploy on push)
- No vendor lock-in
- Forces good static-site practices

**Trade-offs:**
- No server-side rendering
- Hash routing required for SPA
- No edge functions

---

## ADR-003: Hash Routing

**Decision:** Use hash routing (`/#/achievement/123`) instead of history routing.

**Rationale:**
- GitHub Pages doesn't support SPA fallback routing
- No 404.html hacks needed
- Works reliably without server config

**Trade-offs:**
- URLs less clean
- SEO impact (not relevant for this app)

---

## ADR-004: Curated Strategies over Pure Scraping

**Decision:** Prioritize curated JSON strategies over Wowhead scraping.

**Rationale:**
- Scraping is fragile (Wowhead can change anytime)
- Curated content is higher quality
- Community can contribute via PRs
- Wowhead remains as fallback

**Trade-offs:**
- Requires manual effort to add strategies
- Coverage limited to contributed content

---

## ADR-005: No Server-Side User Data

**Decision:** Store all user data (pins, notes, selections) in localStorage only.

**Rationale:**
- Simplifies architecture (no user database)
- Privacy-friendly (data stays on device)
- No GDPR concerns
- Reduces backend complexity

**Trade-offs:**
- Data doesn't sync across devices
- Lost if browser data cleared
- Can't share configurations

---

## ADR-006: EU-Only Scope

**Decision:** Support EU region only, not US/KR/TW/CN.

**Rationale:**
- Simplifies API calls (single region)
- Developer is EU-based
- Reduces testing matrix
- Can expand later if needed

**Trade-offs:**
- Excludes non-EU players
- Would need refactoring to add regions

---

## ADR-007: React Query for Server State

**Decision:** Use React Query (TanStack Query) for API data fetching.

**Rationale:**
- Built-in caching and deduplication
- Automatic background refetching
- Loading/error states handled
- Reduces boilerplate

**Trade-offs:**
- Additional dependency
- Learning curve
- Currently only used for manifest (could expand)

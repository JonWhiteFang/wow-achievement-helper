# HELP_PROVIDERS.md

## Purpose

Strategy/community content is sourced from external providers (curated first, Wowhead fallback).
The Worker exposes a single endpoint:

- `/api/help/achievement/:id?top=10`

Internally, the Worker uses provider adapters that all output the same normalized shape.

## Normalized Output Shape

```ts
type HelpPayload = {
  achievementId: number;
  strategy: Array<{ title: string; steps: string[] }>;
  comments: Array<{ author: string; text: string; score: number | null; date: string | null }>;
  sources: Array<{ name: string; url: string }>;
};
```

## Provider Adapter Interface

```ts
interface HelpProvider {
  name: string;
  supports(achievementId: number): boolean;
  fetch(achievementId: number, top: number): Promise<Partial<HelpPayload> | null>;
}
```

## Provider Priority

1) **Curated provider** (first-class)
   - Reads from `workers/api/src/data/strategy/*.json`
   - Returns structured strategy steps
   - Community-contributed via PRs
   
2) **Wowhead provider** (fallback)
   - Attempts to retrieve top comments (best-effort)
   - Wrapped in resilience guards (won't fail entire request)
   - Returns source link always
   
3) **Link-only fallback**
   - Returns empty strategy/comments
   - Returns sources = [{ name: "Wowhead", url: "..." }]

## Curated Strategy Format

JSON files in `workers/api/src/data/strategy/` named by achievement ID:

```json
{
  "achievementId": 7520,
  "strategy": [
    {
      "title": "Setup",
      "steps": [
        "Step 1...",
        "Step 2..."
      ]
    }
  ]
}
```

See `workers/api/src/data/strategy/README.md` for contribution guidelines.

## Sanitization Rules (Critical)

- Never trust provider HTML.
- Extract plain text only where possible.
- If rendering formatted text, sanitize strictly and use allowlists.
- Strip scripts, inline event handlers, iframes, unknown tags, etc.

## Caching Rules

- Cache per achievement help payload for 12 hours.
- Provide manual refresh in UI.
- Optional: add `?nocache=1` support for development/admin usage.

## Adding New Providers

1) Create adapter in `workers/api/src/help/`
2) Implement `HelpProvider` interface
3) Add to provider chain in `workers/api/src/help/index.ts`
4) Ensure graceful failure (return null, don't throw)

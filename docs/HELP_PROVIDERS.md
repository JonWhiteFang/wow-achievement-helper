# HELP_PROVIDERS.md

## Purpose

Strategy/community content is sourced from external providers (Wowhead preferred, fallback allowed).
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

1) Wowhead provider
   - attempts to retrieve structured strategy and top comments (best-effort)
   - returns source link always if it fetched anything
2) Secondary provider(s)
   - open-source wiki-like sites or curated static dataset (optional)
3) Link-only fallback
   - returns empty strategy/comments
   - returns sources = [{ name: "Wowhead", url: "..." }]

## Sanitization Rules (Critical)

- Never trust provider HTML.
- Extract plain text only where possible.
- If rendering formatted text, sanitize strictly and use allowlists.
- Strip scripts, inline event handlers, iframes, unknown tags, etc.

## Caching Rules

- Cache per achievement help payload for 6–24 hours.
- Provide manual refresh in UI.
- Optional: add `?nocache=1` support for development/admin usage.

# Testing Strategy

## What to Test

### Unit Tests (Vitest) — workers/api

Required:
- Pure functions (merge logic, normalization, parsing)
- Session validation logic
- Help provider output normalization
- Error handling paths

Not required:
- Simple pass-through handlers
- External API calls (mock instead)

### E2E Tests (Playwright) — apps/web

Required:
- Critical user flows (load manifest, open drawer)
- Search functionality
- Error state rendering

Not required:
- Every UI permutation
- Styling/layout

## Test File Naming

- Unit tests: `*.test.ts` (co-located with source)
- E2E tests: `apps/web/e2e/*.spec.ts`

## Mocking

### Blizzard API
```typescript
const mockResponse = { achievements: [...] };
vi.spyOn(global, 'fetch').mockResolvedValue(
  new Response(JSON.stringify(mockResponse))
);
```

### KV Storage
```typescript
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
};
```

## Coverage Expectations

- Focus on logic, not UI
- New features with complex logic should have tests
- Bug fixes should include regression tests
- No strict coverage percentage required

## Existing Tests Reference

- `workers/api/src/merge.test.ts`
- `workers/api/src/auth/session.test.ts`
- `workers/api/src/blizzard/character.test.ts`
- `workers/api/src/help/types.test.ts`
- `apps/web/e2e/*.spec.ts`

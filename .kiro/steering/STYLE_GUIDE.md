# Style Guide

## TypeScript

- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Explicit return types on exported functions
- Use `unknown` over `any`
- Prefer `const` over `let`

## React (apps/web)

- Functional components only
- Custom hooks for reusable logic (prefix with `use`)
- React Query for server state
- Local state for UI-only state
- Props interfaces named `{Component}Props`

## CSS (apps/web)

- CSS variables in `theme.css` for colors/spacing
- Component classes in `components.css`
- Avoid inline styles except for dynamic values
- Class naming: `kebab-case`

## Naming Conventions

- Files: `kebab-case.ts`, `PascalCase.tsx` for components
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

## Import Order

1. React imports
2. External libraries
3. Internal absolute imports
4. Relative imports
5. CSS imports last

## Worker (workers/api)

- Use centralized `json()` and `err()` helpers
- Type all request/response shapes
- Handle errors explicitly (no silent catches)

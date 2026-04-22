# Standards — Code, Naming, Testing, Tooling, Performance

> Load when you need exact lint rules, test recipes, or perf targets.

---

## 1. TypeScript

### `tsconfig.json` (must include)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Do

- Infer from Zod: `type X = z.infer<typeof XSchema>`.
- **Branded types** for IDs:

  ```ts
  export type TransactionId = string & { readonly __brand: 'TransactionId' };
  ```

- **Discriminated unions** instead of boolean flags:

  ```ts
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };
  ```

- `readonly` for props and immutable data.
- `import type { ... }` for type-only imports.

### Don't

- `any` — use `unknown` and narrow.
- `!` non-null assertion on possibly-undefined values — narrow.
- `as T` on network data — use `Schema.parse()`.
- `@ts-ignore` — prefer `@ts-expect-error` + comment + ticket, only when unavoidable.
- Enums — use `as const` objects.

### Errors

```ts
try { await doThing(); }
catch (err) {
  if (err instanceof HttpError && err.status === 404) return null;
  throw err;
}
```

---

## 2. Components & Hooks

### Components

- Functional only. One component per file, `PascalCase.tsx`.
- Destructure props at the top; default values in destructuring. Explicit prop types.
- Keep under ~150 LOC; split larger components.
- **No business logic in UI** (no fetching, no Zod parsing, no heavy aggregation, no direct `localStorage`).
- Semantic HTML first. Icon-only buttons need `aria-label`. Every data-bound UI must render loading / error / empty / success.
- Event handlers: prop is `onX`, internal is `handleX`.

### Hooks

- Always prefixed `use`. Feature-only → `features/<f>/hooks/`; generic → `shared/hooks/`.
- Move fetching, URL state, pagination, form state, subscriptions into hooks.
- `useEffect` is a last resort. Every effect with a subscription/timer must cleanup. Never sync derived state into state with `useEffect`.

### Composition

- Prefer children / slots over boolean-flag props.
- Avoid prop drilling >2 levels — use Context (with guard hook) or Zustand.

---

## 3. Naming

| Element                    | Convention                              | Example                              |
| -------------------------- | --------------------------------------- | ------------------------------------ |
| Component / type           | `PascalCase`                            | `TransactionsTable`                  |
| Page component             | `<Name>Page`                            | `TransactionsPage`                   |
| Zod schema                 | `PascalCaseSchema`                      | `TransactionSchema`                  |
| Hook                       | `useCamelCase`                          | `useTransactions`                    |
| Service                    | `<noun>Service`                         | `transactionsService`                |
| Pure function              | `camelCase`                             | `groupByCardType`, `formatMoney`     |
| Constant                   | `UPPER_SNAKE_CASE`                      | `MAX_UPLOAD_SIZE_BYTES`              |
| Enum-like                  | `as const` object                       | `CARD_TYPE = { AMEX: 'AMEX' } as const` |
| CSS Module class           | `camelCase`                             | `styles.rowActive`                   |
| CSS variable (token)       | `--kebab-case`                          | `--color-primary-500`                |
| Test file                  | `*.test.ts(x)`                          | `groupByCardType.test.ts`            |
| Env variable               | `VITE_UPPER_SNAKE`                      | `VITE_API_BASE_URL`                  |
| Route path constant        | `camelCase` in `paths`                  | `paths.transactions`                 |
| Boolean                    | `is/has/can/should` prefix              | `isLoading`, `hasError`              |
| Handler prop / internal    | `onX` / `handleX`                       | `onSubmit` / `handleSubmit`          |
| Folder                     | `kebab-case` or single word             | `rejected-transactions`              |

- Acronyms in type/function names: `PascalCase` (`HttpClient`, not `HTTPClient`).
- Do not suffix folders with `-components`, `-hooks` — the folder name already says so.
- No abbreviations unless industry-standard (`URL`, `HTTP`, `ID`).

---

## 4. Tooling

### ESLint (flat config)

```ts
// eslint.config.ts — key rules only
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/no-cycle': 'error',
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', ['parent','sibling','index'], 'type'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/no-restricted-paths': ['error', { zones: [
        { target: './src/shared', from: ['./src/features', './src/app'] },
        { target: './src/features/*/*', from: ['./src/features/*/*'],
          except: ['./index.ts', './types/**'] },
      ]}],
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
    },
  },
  prettier,
);
```

### Prettier

```json
{ "printWidth": 100, "singleQuote": true, "trailingComma": "all", "semi": true, "arrowParens": "always" }
```

### Husky + lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

- `.husky/pre-commit` → `npx lint-staged`
- `.husky/commit-msg` → commitlint (Conventional Commits)

### Scripts

```
"dev":       "vite",
"build":     "tsc -b && vite build",
"preview":   "vite preview",
"lint":      "eslint . --max-warnings=0",
"format":    "prettier --write .",
"typecheck": "tsc --noEmit",
"test":      "vitest",
"test:ci":   "vitest run --coverage"
```

### CI gates (must all pass)

1. `typecheck` 2. `lint` 3. `test:ci` 4. `build`

---

## 5. Testing

### Stack

Vitest + React Testing Library + `user-event` + `@testing-library/jest-dom` + MSW.

### Setup

```ts
// src/test/vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```ts
// vitest.config.ts (or inside vite.config.ts)
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/vitest.setup.ts'],
  css: true,
  coverage: { provider: 'v8', reporter: ['text', 'html', 'lcov'] },
}
```

### `renderWithProviders`

```tsx
// src/test/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', ...options }: { route?: string } & RenderOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
    options,
  );
}
```

### Rules

- Query by role + name first; `getByTestId` is last resort.
- Use `userEvent.setup()`, not `fireEvent`. Use `findBy*` for async; no arbitrary `waitFor` timeouts.
- Mock network with MSW (`server.use(http.get(...))`), never `vi.spyOn(global, 'fetch')`.
- Fresh `QueryClient` per test to avoid cache leakage.
- No full-tree snapshots. Targeted snapshots only for stable outputs.

### What to test

| Layer      | Must cover                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Pure `lib/`| Every branch; unit tests without mocks                                  |
| Services   | Request shape, successful parse, `ValidationError` on bad payload        |
| Hooks      | Non-trivial logic via `renderHook` or a host component                  |
| Components | Loading / error / empty / success; key interactions                     |
| Shared UI  | Variants, keyboard a11y, disabled state                                 |

### Coverage gates

- `shared/lib/**` and `features/**/lib/**`: ≥ 80% lines & functions.
- `services/**`: ≥ 80% lines.
- Components: no hard threshold, but critical paths covered.

### Examples

Service:

```ts
describe('transactionsService.list', () => {
  it('parses and returns transactions', async () => {
    server.use(http.get('*/transactions', () =>
      HttpResponse.json({ items: [/*...*/], nextCursor: null }),
    ));
    const res = await transactionsService.list({ limit: 10 });
    expect(res.items[0].cardType).toBe('VISA');
  });

  it('throws ValidationError on malformed payload', async () => {
    server.use(http.get('*/transactions', () => HttpResponse.json({ items: 'nope' })));
    await expect(transactionsService.list({})).rejects.toBeInstanceOf(ValidationError);
  });
});
```

Component:

```tsx
it('shows skeleton, then empty state', async () => {
  server.use(http.get('*/transactions', () =>
    HttpResponse.json({ items: [], nextCursor: null })));
  renderWithProviders(<TransactionsPage />, { route: '/transactions' });
  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /no transactions/i })).toBeInTheDocument();
});
```

---

## 6. Performance

### Budgets

- Initial JS (gzipped, first route) ≤ **180 KB**.
- Largest chunk (gzipped) ≤ **350 KB**.
- LCP on mid-tier mobile / 4G ≤ **2.5s**; INP ≤ **200ms**; CLS ≤ **0.1**.

### Code splitting

- Pages: always lazy-loaded.
- Heavy libs (charts, PDF, editors, Markdown, syntax highlighters): dynamic `import()` inside the feature that needs them.
- Let Vite/Rollup handle vendor chunking unless measured.

### Rendering

- Derive during render; don't copy props into state.
- Memoize (`useMemo` / `useCallback` / `React.memo`) only when passing to memoized children or when computation is measurably expensive.
- Avoid inline object/array literals as props to memoized children.
- Virtualize lists > 200 rows via `@tanstack/react-virtual`. Stable unique `key`s.
- Use `useTransition()` for non-urgent state updates that block input.

### React Query tuning

- Default `staleTime: 30_000` to avoid refetch storms.
- `placeholderData: keepPreviousData` for paginated tables.
- Pass `signal` from `queryFn` into services for automatic cancellation.

### CSS

- Animate `transform` / `opacity` only.
- `contain: content` on isolated widgets.
- `will-change` sparingly and only on interaction-driven elements.

### Assets

- SVG > PNG for icons.
- `<img loading="lazy" decoding="async" width height>` on non-hero images.
- Subset fonts; `font-display: swap`.

### Measurement

- `web-vitals` in production → analytics endpoint (or `console` in dev).
- `rollup-plugin-visualizer` artifact on `build` for bundle inspection.

---

## 7. Security

- Validate all inbound payloads with Zod at the service boundary.
- Avoid `dangerouslySetInnerHTML`; if unavoidable, sanitize with DOMPurify.
- Never commit `.env`, `.env.local`, or any secret. Only `VITE_*` public values ship to the browser.
- Prefer HttpOnly cookies for auth; if tokens live in JS, keep them in memory only (never `localStorage`).
- Never log PII, card numbers, or full JWTs.
- `npm audit` in CI; pin via `package-lock.json`.

---

## 8. Git hygiene

- Conventional Commits (`feat(transactions): …`, `fix(api): …`).
- One concern per PR; keep diffs reviewable (< 400 lines where possible).
- PR body: **What / Why / How to test / Screenshots (if UI)**.
- CI (typecheck + lint + test + build) must be green to merge.

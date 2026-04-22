# Architecture

> Structure, folders, routing, and environment for the `client/` app.

---

## 1. Stack

| Concern             | Choice                                        |
| ------------------- | --------------------------------------------- |
| Language            | TypeScript (strict)                           |
| UI                  | React 18+                                     |
| Build               | Vite 5+ (never CRA)                           |
| Runtime             | Node LTS >= 18                                |
| Routing             | React Router v6 (lazy pages)                  |
| Server state        | TanStack React Query v5                       |
| Global UI state     | Zustand (only if Context is insufficient)     |
| Forms               | React Hook Form + Zod                         |
| HTTP                | native `fetch` wrapped in `apiClient`         |
| Styling             | CSS Modules + CSS variables                   |
| Testing             | Vitest + React Testing Library + MSW          |
| Lint/format/hooks   | ESLint (flat) + Prettier + Husky + lint-staged |

**Non-negotiables**: no `.js` in `src/`, no `any`, no `process.env` (only `import.meta.env.VITE_*` through `env.ts`).

---

## 2. Principles

- **Feature-based (vertical) architecture.** Organize by capability (`transactions`, `reports`), not by file type.
- **Separation of concerns**: UI (components) → Logic (hooks) → API (services). Data flows one way.
- **Composition over inheritance.** Components are functions; reuse via hooks, children, slots.
- **Pure core, impure edges.** Formatters/mappers in `lib/` are pure and testable without mocks. Side effects live in `services/`.
- **Dependency direction**: `app → routes → features → shared`. `shared/` never imports features or app. Features never import each other's internals.

---

## 3. Folder Structure

```
client/
├── .claude/                  # AI guidance (this folder)
├── .cursor/rules/            # Enforcement rules (.mdc)
├── public/                   # Static files served as-is
├── src/
│   ├── app/                  # Providers, router, env, composition root
│   ├── features/             # Vertical slices
│   ├── shared/               # Cross-feature primitives
│   ├── routes/               # Route tree, paths, layouts
│   ├── styles/               # tokens.css, global.css, themes/
│   ├── assets/               # icons/, images/, fonts/
│   ├── test/                 # vitest.setup.ts, test-utils.tsx, msw/
│   ├── main.tsx              # single createRoot().render(<App />)
│   └── vite-env.d.ts
├── .env.example
├── eslint.config.ts
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

### `src/app/` — composition root (no domain logic)

```
app/
├── providers/
│   ├── AppProviders.tsx      # Composes every Provider
│   ├── QueryProvider.tsx     # QueryClientProvider + Devtools
│   ├── ThemeProvider.tsx     # Theme context + data-theme attribute
│   └── ErrorBoundary.tsx
├── router/
│   ├── AppRouter.tsx         # <BrowserRouter> + <Suspense>
│   └── NotFoundPage.tsx
├── config/
│   ├── env.ts                # Zod-parsed import.meta.env
│   └── queryClient.ts
└── App.tsx                   # <AppProviders><AppRouter /></AppProviders>
```

### `src/features/<feature>/` — vertical slice

```
features/<feature>/
├── pages/        # Screens. Composed, not monolithic.
├── components/   # Feature-only UI
├── hooks/        # Feature-only hooks (useX)
├── services/     # HTTP + DTO→domain mapping (React-free)
├── types/        # Zod schemas + inferred types
├── lib/          # Pure helpers (formatters, mappers, selectors)
├── __tests__/    # Or co-located *.test.tsx
└── index.ts      # Public API — export only what other layers consume
```

### `src/shared/` — feature-agnostic primitives

```
shared/
├── ui/           # Design-system components (Button, Card, Table, Modal, EmptyState, …)
├── hooks/        # Generic hooks (useDebounce, useLocalStorage, useMediaQuery, useUrlState)
├── lib/          # Pure utilities (money, date, csv, zod helpers)
├── api/          # apiClient, ApiError, http helpers
├── types/        # Global DTOs, branded types
└── constants/    # Routes, query keys, regex
```

### `src/routes/` — thin route tree

```
routes/
├── index.tsx       # <AppRoutes /> with lazy pages
├── paths.ts        # Typed path constants — single source
└── layouts/
    ├── AppLayout.tsx
    └── BlankLayout.tsx
```

### Placement cheat-sheet

| What                                 | Where                                     |
| ------------------------------------ | ----------------------------------------- |
| Screen                               | `features/<f>/pages/<Name>Page.tsx`       |
| Component used by one feature        | `features/<f>/components/`                |
| Reusable component across features   | `shared/ui/`                              |
| Feature-only hook                    | `features/<f>/hooks/`                     |
| Generic hook                         | `shared/hooks/`                           |
| HTTP call                            | `features/<f>/services/` (or `shared/api/`)|
| Pure utility                         | `features/<f>/lib/` or `shared/lib/`      |
| Route                                | `routes/index.tsx` + `routes/paths.ts`    |
| Design token                         | `styles/tokens.css`                       |
| Env variable usage                   | Only through `app/config/env.ts`          |

### Path aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

```
'@'         → ./src
'@app'      → ./src/app
'@features' → ./src/features
'@shared'   → ./src/shared
'@routes'   → ./src/routes
'@styles'   → ./src/styles
'@assets'   → ./src/assets
```

No `../../../`. Relative imports only **within** the same feature.

### Import rules (enforced via ESLint `import/no-restricted-paths`)

- `shared/` MUST NOT import from `features/` or `app/`.
- `features/<a>/` imports from `features/<b>/` only through `features/<b>/index.ts` (or the target `types/`).
- `app/` may import from anywhere.

---

## 4. Routing

- React Router v6, `<BrowserRouter>`, root `<Suspense fallback={<PageSkeleton />}>`.
- **Every page is lazy-loaded.** Path strings live only in `routes/paths.ts`.

```tsx
// src/routes/paths.ts
export const paths = {
  root: '/',
  upload: '/upload',
  transactions: '/transactions',
  reports: '/reports',
  rejections: '/rejections',
  notFound: '*',
} as const;
```

```tsx
// src/routes/index.tsx
import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { paths } from './paths';
import { NotFoundPage } from '@/app/router/NotFoundPage';

const TransactionsPage = lazy(() =>
  import('@/features/transactions/pages/TransactionsPage').then((m) => ({
    default: m.TransactionsPage,
  })),
);

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to={paths.transactions} replace />} />
      <Route path={paths.transactions} element={<TransactionsPage />} />
      <Route path={paths.notFound} element={<NotFoundPage />} />
    </Route>
  </Routes>
);
```

Navigation: `<Link to={paths.x}>` or `useNavigate()`. Never inline literal paths. Auth-gated subtrees wrap `<Outlet />` in a guard component that redirects if unauthenticated.

Preload on hover for primary nav (optional):

```ts
const preload = () => import('@/features/reports/pages/ReportsPage');
<Link to={paths.reports} onMouseEnter={preload}>Reports</Link>;
```

---

## 5. Environment Configuration

- **All env vars prefixed `VITE_`** (Vite requirement for browser exposure).
- Declared in `.env.example`; secrets never committed.
- Read **only** through `src/app/config/env.ts`, which validates with Zod and fails fast.

```ts
// src/app/config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_ENABLE_DEVTOOLS: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = EnvSchema.safeParse(import.meta.env);
if (!parsed.success) {
  console.error('Invalid env:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment. See .env.example.');
}
export const env = parsed.data;
```

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_ENABLE_DEVTOOLS?: 'true' | 'false';
}
interface ImportMeta { readonly env: ImportMetaEnv }
```

Files: `.env.development` / `.env.production` are committed (non-secret defaults). `.env`, `.env.local`, `.env.*.local` are gitignored. `.env.example` is the template.

Modes: `vite` (dev) / `vite build` (prod); override with `--mode=staging`.

---

## 6. Domain Context

The client is the UI for a **card transaction processor**. Expected features:

- `features/upload/` — upload transaction files (CSV/JSON).
- `features/transactions/` — list, filter, inspect transactions.
- `features/reports/` — volume by card, by card type, by day.
- `features/rejections/` — rejected transactions and reasons.

**Money**: never carry monetary amounts as `number` once they leave the network layer. Use integer minor units (`amountMinor: number`, `currency: string`) or a `Money` type. Format with a single `formatMoney()` in `shared/lib/money.ts`. Precision must match the backend.

---

## 7. "Done" checklist for a feature

- [ ] Pages in `features/<f>/pages/`
- [ ] Services with Zod-validated responses in `features/<f>/services/`
- [ ] Hooks wrap React Query; query keys as a `const` tree
- [ ] Loading / error / empty / success states rendered
- [ ] Accessible markup (semantic HTML, keyboard, labeled controls)
- [ ] Unit tests for `lib/`, component tests for critical UI
- [ ] Public `index.ts` exports only what other layers need

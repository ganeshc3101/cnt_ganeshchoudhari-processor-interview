# Patterns — API, State, UI

> Concrete implementation recipes. Load when writing services, hooks, or UI.

---

## 1. API Layer

### 1.1 Principles

- All HTTP goes through `shared/api/apiClient.ts`.
- Every response is **validated at the boundary** with Zod — nothing untyped enters app state.
- Services are React-free. Components call hooks; hooks call services.
- Typed errors: `HttpError`, `NetworkError`, `ValidationError`.

### 1.2 Error classes

```ts
// src/shared/api/ApiError.ts
export class ApiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export class HttpError extends ApiError {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
    readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} — ${url}`);
    this.name = 'HttpError';
  }
}

export class NetworkError extends ApiError {
  constructor(cause: unknown, readonly url: string) {
    super(`Network failure — ${url}`, cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  constructor(readonly issues: unknown, readonly url: string) {
    super(`Response validation failed — ${url}`);
    this.name = 'ValidationError';
  }
}
```

### 1.3 `apiClient`

```ts
// src/shared/api/apiClient.ts
import { z, type ZodTypeAny } from 'zod';
import { env } from '@/app/config/env';
import { HttpError, NetworkError, ValidationError } from './ApiError';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions<TSchema extends ZodTypeAny> = {
  method?: Method;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  schema: TSchema;           // required — forces validation
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions<ZodTypeAny>['query']) {
  const url = new URL(path.replace(/^\//, ''), env.VITE_API_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<TSchema extends ZodTypeAny>(
  opts: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const { method = 'GET', path, query, body, headers, schema, signal } = opts;
  const url = buildUrl(path, query);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new NetworkError(cause, url);
  }

  const text = await res.text();
  const data = text.length > 0 ? safeJson(text) : undefined;
  if (!res.ok) throw new HttpError(res.status, res.statusText, data, url);

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ValidationError(parsed.error.issues, url);
  return parsed.data;
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}
```

> Making `schema` **required** eliminates accidentally consuming unvalidated data. For empty responses, pass `z.void()` or `z.null()`.

### 1.4 Service + types + hook (canonical example)

```ts
// src/features/transactions/types/transaction.ts
import { z } from 'zod';

export const CardTypeSchema = z.enum(['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER']);
export type CardType = z.infer<typeof CardTypeSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  cardNumber: z.string(),
  cardType: CardTypeSchema,
  amountMinor: z.number().int(),
  currency: z.string().length(3),
  occurredAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
```

```ts
// src/features/transactions/services/transactionsService.ts
import { z } from 'zod';
import { apiRequest } from '@/shared/api/apiClient';
import { TransactionSchema, type Transaction } from '../types/transaction';

const ListResponseSchema = z.object({
  items: z.array(TransactionSchema),
  nextCursor: z.string().nullable(),
});

export type ListTransactionsParams = {
  cursor?: string;
  limit?: number;
  cardType?: Transaction['cardType'];
  from?: string;
  to?: string;
};

export const transactionsService = {
  list(params: ListTransactionsParams, signal?: AbortSignal) {
    return apiRequest({
      method: 'GET',
      path: '/transactions',
      query: params,
      schema: ListResponseSchema,
      signal,
    });
  },
};
```

```ts
// src/features/transactions/hooks/useTransactions.ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { transactionsService, type ListTransactionsParams }
  from '../services/transactionsService';

export const transactionsKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionsKeys.all, 'list'] as const,
  list: (p: ListTransactionsParams) => [...transactionsKeys.lists(), p] as const,
  detail: (id: string) => [...transactionsKeys.all, 'detail', id] as const,
};

export function useTransactions(params: ListTransactionsParams) {
  return useQuery({
    queryKey: transactionsKeys.list(params),
    queryFn: ({ signal }) => transactionsService.list(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
```

### 1.5 Mutations + invalidation

```ts
export function useUploadTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => transactionsService.uploadFile(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsKeys.all }),
  });
}
```

### 1.6 Error handling

- Services re-throw; they don't swallow.
- In hooks/components, narrow with `instanceof`:

```ts
if (error instanceof HttpError && error.status === 404) return <NotFound />;
if (error instanceof ValidationError) reportBug(error.issues);
```

- Global toast on mutation errors (configured on `QueryClient`). Unrecoverable errors propagate to the nearest `<ErrorBoundary>`.

### 1.7 Auth

- HttpOnly cookies with `credentials: 'include'`. If bearer tokens are unavoidable, keep them in **memory only** (never `localStorage`), refresh on 401.

---

## 2. State Management

### 2.1 Decision matrix

| Kind                              | Tool                                          |
| --------------------------------- | --------------------------------------------- |
| Local UI                          | `useState` / `useReducer`                     |
| Derived                           | Compute during render / `useMemo` if costly   |
| URL-shareable                     | `useSearchParams` / `useUrlState` (helper)    |
| Shared within a subtree           | React Context (one per concern, guard hook)   |
| Frequently-updating global UI     | Zustand (typed selectors)                     |
| **Server data**                   | **React Query — no exceptions**               |
| Forms                             | React Hook Form + Zod                         |
| Preferences                       | `useLocalStorage`                             |

### 2.2 React Query setup

```ts
// src/app/config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { HttpError } from '@/shared/api/ApiError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        if (err instanceof HttpError && err.status >= 400 && err.status < 500) return false;
        return count < 2;
      },
    },
    mutations: { retry: 0 },
  },
});
```

Rules:

- Query keys as a `const` tree next to the hook (`keys.all`, `keys.list(p)`, `keys.detail(id)`). Never string-concat.
- Mutations invalidate the narrowest scope that changed.
- For optimistic UX: `onMutate` (snapshot + optimistic write) → `onError` (rollback) → `onSettled` (invalidate).
- Cancellation: pass `signal` from `queryFn({ signal })` into the service.

### 2.3 URL state helper

```ts
// src/shared/hooks/useUrlState.ts
import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { z, type ZodTypeAny } from 'zod';

export function useUrlState<TSchema extends ZodTypeAny>(schema: TSchema) {
  const [params, setParams] = useSearchParams();

  const value = useMemo<z.infer<TSchema>>(
    () => schema.parse(Object.fromEntries(params.entries())),
    [params, schema],
  );

  const set = useCallback(
    (next: Partial<z.infer<TSchema>>) => {
      setParams((prev) => {
        const merged = { ...Object.fromEntries(prev.entries()), ...next };
        return Object.entries(merged).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== '') acc.set(k, String(v));
          return acc;
        }, new URLSearchParams());
      });
    },
    [setParams],
  );

  return [value, set] as const;
}
```

### 2.4 Context pattern (guard hook)

```tsx
type AuthContextValue = {
  user: User | null;
  signIn: (c: Credentials) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: async (c) => setUser(await authService.signIn(c)),
      signOut: () => setUser(null),
    }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
```

- One context per concern (Auth, Theme, Toast). Never a "god context".
- Split state and dispatcher contexts if state updates often.
- Always expose a guard hook; never the raw context.

### 2.5 Zustand (only when Context is wrong)

```ts
// src/app/stores/useAppShellStore.ts
import { create } from 'zustand';

type AppShellState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useAppShellStore = create<AppShellState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
```

Consume via selectors:

```tsx
const sidebarOpen = useAppShellStore((s) => s.sidebarOpen);
```

- Never store server data.
- One store per concern.
- Persist (`zustand/middleware`) only for preferences.

### 2.6 Forms

```tsx
const FormSchema = z.object({
  file: z.instanceof(File, { message: 'Choose a file' }),
  cardType: z.enum(['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER']).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(FormSchema),
});
```

Surface server errors via `setError`.

### 2.7 Decision flow

```
Server-fetched?         → React Query
URL-shareable?          → useSearchParams / useUrlState
Used by this component? → useState / useReducer
Small subtree?          → lift state / React Context
Frequently updating,
  many consumers?       → Zustand
Otherwise?              → React Context
```

### 2.8 Anti-patterns (rejected in review)

- Duplicating server data into Zustand/Context.
- `useEffect` syncing derived state back into state.
- God context / god store.
- Reading `localStorage` inside render.
- String-concatenated query keys.

---

## 3. Theming & UI

> **Authoritative brand + design-system spec: `.claude/theming.md`.** The values below are the implementation recipe; when they diverge, `theming.md` wins.

### 3.1 Tokens (`src/styles/tokens.css`)

```css
:root {
  /* Brand (SignaPay-inspired) */
  --color-primary-500: #F26122;
  --color-primary-600: #D94E12;
  --color-primary-100: #FFE7D8;
  --color-secondary-500: #00A0DD;
  --color-secondary-700: #0E4C90;
  --color-accent-900: #0C1D26;
  --color-accent-800: #122F4F;

  /* Neutrals */
  --color-neutral-0:   #ffffff;
  --color-neutral-50:  #F7F9FC;
  --color-neutral-100: #EDF3FF;
  --color-neutral-200: #D3E1ED;
  --color-neutral-500: #6B7076;
  --color-neutral-700: #4A4C50;
  --color-neutral-900: #0C1D26;

  /* Semantic (use these in features) */
  --color-bg-canvas:      var(--color-neutral-50);
  --color-bg-surface:     var(--color-neutral-0);
  --color-bg-surface-alt: var(--color-neutral-100);
  --color-fg-primary:     var(--color-neutral-900);
  --color-fg-secondary:   var(--color-neutral-700);
  --color-fg-muted:       var(--color-neutral-500);
  --color-border:         var(--color-neutral-200);
  --color-focus-ring:     var(--color-primary-500);
  --color-success-500:    #1F9D55;
  --color-warning-500:    #D97706;
  --color-danger-500:     #C53F05;
  --color-info-500:       var(--color-secondary-500);

  /* Typography */
  --font-display: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 0.75rem; --font-size-sm: 0.875rem; --font-size-md: 1rem;
  --font-size-lg: 1.125rem; --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem; --font-size-3xl: 1.875rem; --font-size-4xl: 2.25rem;
  --font-weight-regular: 400; --font-weight-medium: 500;
  --font-weight-semibold: 600; --font-weight-bold: 700;
  --line-height-tight: 1.2; --line-height-normal: 1.5;

  /* Spacing (4pt grid) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem; --space-5: 1.25rem; --space-6: 1.5rem;
  --space-8: 2rem; --space-10: 2.5rem; --space-12: 3rem; --space-16: 4rem;

  /* Radii, shadows, motion */
  --radius-sm: 2px; --radius-md: 6px; --radius-lg: 10px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.06);
  --shadow-md: 0 4px 12px rgba(15,23,42,.08);
  --shadow-lg: 0 12px 32px rgba(15,23,42,.12);
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --duration-fast: 120ms; --duration-normal: 200ms; --duration-slow: 320ms;

  /* z-index, layout, breakpoints */
  --z-dropdown: 1000; --z-sticky: 1100; --z-modal: 1200; --z-toast: 1300;
  --container-max: 1280px; --app-header-h: 64px; --app-sidebar-w: 256px;
  --bp-sm: 640px; --bp-md: 768px; --bp-lg: 1024px; --bp-xl: 1280px;
}

[data-theme='dark'] {
  --color-bg-canvas:      #0b1220;
  --color-bg-surface:     #111a2e;
  --color-bg-surface-alt: #172038;
  --color-fg-primary:     #f8fafc;
  --color-fg-secondary:   #cbd5e1;
  --color-fg-muted:       #94a3b8;
  --color-border:         #233054;
}
```

### 3.2 ThemeProvider

```tsx
type ThemeMode = 'light' | 'dark' | 'system';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useLocalStorage<ThemeMode>('theme', 'system');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const value = useMemo(() => ({ mode, setMode, resolved }), [mode, setMode, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

### 3.3 Styling rules

- CSS Modules only (`Component.module.css`). No runtime CSS-in-JS.
- `clsx` for conditional classes. Class names are `camelCase` inside modules.
- No hard-coded colors / pixels / font sizes — always `var(--…)`.
- Prefer **semantic** tokens (`--color-fg-primary`) over raw scale (`--color-neutral-900`) in feature code.
- Spacing is the 4-point grid only (`--space-*`).

### 3.4 Component skeleton

```tsx
// src/shared/ui/Button/Button.tsx
import clsx from 'clsx';
import styles from './Button.module.css';

type Props = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={clsx(styles.root, styles[variant], styles[size], className)}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}
```

### 3.5 Layout

- Every route renders inside `AppLayout` (header + sidebar + `<main>`).
- Pages compose via a reusable `<PageLayout title subtitle actions>` + smaller components.
- Use CSS Grid / Flexbox; no absolute-positioning hacks.

### 3.6 UX states (required on every data-bound UI)

```tsx
if (isLoading) return <TableSkeleton rows={10} />;
if (isError)   return <ErrorState onRetry={refetch} />;
if (!data.items.length) {
  return <EmptyState title="No transactions yet" description="Upload a file to get started." />;
}
return <Table rows={data.items} />;
```

### 3.7 Responsiveness

- Mobile-first. `@media (min-width: …)`, not `max-width` first.
- Touch targets ≥ 44×44px. Validate at 360 / 768 / 1280.

### 3.8 Accessibility

- Semantic HTML first. `role=` only when no semantic element exists.
- Every form control is labeled. Icon-only buttons need `aria-label`.
- Visible focus rings. Keyboard: Tab, Shift-Tab, Enter, Space, Escape, arrow keys in menus/tabs.
- Modals: trap focus, close on Escape, restore focus, `aria-labelledby`.
- WCAG AA contrast.
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.9 Motion

- Animate `transform` / `opacity` only. Use `--duration-*` + `--ease-standard`.
- Micro-interactions ≤ 200ms; route transitions ≤ 320ms.

### 3.10 Icons

- SVG via `vite-plugin-svgr`: `import Icon from '@/assets/icons/arrow.svg?react'`.
- Icons inherit `currentColor` — no hard-coded fills.

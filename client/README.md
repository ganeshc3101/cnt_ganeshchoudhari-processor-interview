# Client — Card transaction processor UI

Single-page application for authenticating against the backend, viewing **reports** and **transactions**, **manually entering** transactions (JSON array), and **uploading** batch files (CSV or JSON). The client talks to a REST API under `/api/v1/*`; see [server README](../server/README.md) for API and database setup.

---

## Technology stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js **18+** |
| UI | **React 18**, **TypeScript** (strict) |
| Build / dev | **Vite 5** (dev server with HMR on port **5173**) |
| Routing | **React Router 6** |
| Server state | **TanStack Query** (React Query v5) |
| Forms | **React Hook Form** + **@hookform/resolvers** |
| Validation / API contract | **Zod** (runtime validation of env and responses) |
| HTTP | Custom `apiClient` in `src/shared/api/` (JSON + multipart helpers) |
| Lint / format | **ESLint 9** (zero-warning policy in `npm run lint`), **Prettier** |

Path aliases are configured in `vite.config.ts`: `@`, `@app`, `@features`, `@shared`, `@routes`, `@styles`, `@assets` → `src/...`.

---

## Prerequisites

- **Node.js 18 or newer** (see `engines` in `package.json`).
- A running **processor-api** backend (default `http://localhost:9091`) with PostgreSQL initialized per the server docs. The UI is useful without the API only for static exploration; login and data views require the server.

---

## Project setup

1. **Install dependencies** (from this `client/` directory):

   ```bash
   npm install
   ```

2. **Environment** — copy the example file and adjust if your API is not on the default host/port:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   | --- | --- |
   | `VITE_API_BASE_URL` | Base URL for REST calls (**no trailing slash**). Default in `.env.example`: `http://localhost:9091/api` so paths like `/v1/auth/login` resolve to `http://localhost:9091/api/v1/auth/login`. |
   | `VITE_APP_ENV` | Logical deploy environment string (e.g. `development`); consumed by `src/app/config/env.ts`. |

   Env is validated at startup with Zod (fail-fast if misconfigured).

3. **Start the dev server:**

   ```bash
   npm run dev
   ```

   Open **http://localhost:5173**.

4. **Production build** (typecheck + Vite build):

   ```bash
   npm run build
   ```

   Preview the build locally: `npm run preview`.

---

## NPM scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | `tsc -b` then production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with `--max-warnings=0` |
| `npm run format` | Prettier write |

---

## Folder structure (`src/`)

High-level layout (feature slices + shared shell):

```
src/
├── app/                    # App shell: env config, providers, router composition
│   ├── config/             # env.ts — Zod-validated Vite env
│   ├── providers/          # React Query, etc.
│   └── router/             # Route tree wiring
├── routes/                 # Route-level pieces
│   ├── guards/             # Auth redirects (e.g. require login)
│   └── layouts/            # App chrome / nested layouts
├── features/
│   ├── auth/               # Login, session (JWT in memory + optional localStorage "remember me")
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/            # token helpers, JWT expiry checks
│   │   ├── pages/
│   │   ├── services/       # authService — login, /me, logout
│   │   └── types/
│   ├── dashboard/          # Dashboard page(s), entry after login
│   └── transactions/       # Reports, table, filters, manual entry, file upload
│       ├── components/     # Tables, charts, upload panel, etc.
│       ├── hooks/
│       ├── lib/
│       ├── services/       # API calls for transactions, reports, batch upload
│       └── types/          # Zod schemas + TS types aligned with API DTOs
├── shared/
│   ├── api/                # apiClient, errors, auth header injection
│   ├── hooks/
│   ├── lib/
│   └── ui/                 # Reusable primitives (Button, Table, charts, …)
├── styles/                 # Global styles
└── assets/
```

**Conventions:** Features own their UI, hooks, and service modules. Shared design-system-style pieces live under `shared/ui`. Cross-cutting API behavior (base URL, 401 handling, attaching `Authorization: Bearer`) lives in `shared/api`.

---

## Authentication and API usage

- **Login** posts to `POST /v1/auth/login` and stores the returned **JWT** via `authTokenStorage` (session-only versus persisted depending on “remember me”).
- **Session** is validated with `GET /v1/auth/me`; the client clears stale tokens on 401 or likely-expired JWT.
- Authenticated requests send `Authorization: Bearer <token>`.

The backend enforces **role-based access** on endpoints; the UI may hide or disable actions based on permissions where implemented (`Can` component / auth context).

Main API areas used by the UI (all relative to `VITE_API_BASE_URL`):

- `/v1/auth/*` — login, logout, current user
- `/v1/transactions` — list, filters, manual create (JSON body)
- `/v1/transactions/batch` — multipart file upload
- `/v1/reports/*` — aggregated reporting for dashboard widgets

Exact shapes are defined in feature `types` and Zod schemas to match the server DTOs.

---

## Contributing / tooling notes

- Cursor/IDE guidance for this package may live under `.cursor/rules/` and optional references in `.claude/` — useful for matching import order, UI patterns, and architecture expectations.
- CORS must allow the dev origin (`http://localhost:5173`) on the server when developing locally.

---

## Troubleshooting

| Issue | What to check |
| --- | --- |
| Network errors / CORS | Server running; `VITE_API_BASE_URL` matches scheme/host/port and includes `/api`; CORS on API allows the Vite origin. |
| 401 immediately after login | JWT secret / clock skew; verify API `application.yml` and client pointing at the same API instance. |
| Empty lists after upload | Batch format and validation rules on the server; check API error responses and rejected-transaction reporting on the server. |

For database seed users, default ports, and Postman collections, see [server README](../server/README.md) and [server/scripts/README.md](../server/scripts/README.md).

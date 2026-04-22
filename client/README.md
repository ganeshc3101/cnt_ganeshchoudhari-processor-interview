# Client

React 18 + TypeScript (strict) + Vite 5 application for the card transaction processor.

## Getting started

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Scripts

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start the Vite dev server (HMR)             |
| `npm run build`     | Typecheck (`tsc -b`) + production build     |
| `npm run preview`   | Preview the built app                       |
| `npm run typecheck` | `tsc --noEmit`                              |
| `npm run lint`      | ESLint (max-warnings=0)                     |
| `npm run format`    | Prettier write                              |

## Environment

Copy `.env.example` to `.env.local` for local overrides. All client vars are prefixed `VITE_` and are read through `src/app/config/env.ts` (Zod-validated, fail-fast).

## Project conventions

This codebase is governed by two sources of truth — read these before contributing:

- `.cursor/rules/` — enforceable rules (`core.mdc`, `code.mdc`, `ui.mdc`)
- `.claude/` — architecture and patterns reference (with examples)

Start with `.claude/README.md`.

## Authentication

The current `authService` (`src/features/auth/services/authService.ts`) is a **mock foundation** that persists a non-sensitive session flag in `localStorage`. It is shaped so the implementation can be replaced with an HttpOnly-cookie + `GET /auth/session` flow without changing any consumer.

**No sensitive tokens are stored in the browser.** Real tokens must live in HttpOnly cookies set by the server.

### Routing

- `/` → redirects to `/dashboard`
- `/login` → public; redirects to `/dashboard` if already authenticated
- `/dashboard` → protected; redirects to `/login` if not authenticated

Route guards: `src/routes/guards/`.

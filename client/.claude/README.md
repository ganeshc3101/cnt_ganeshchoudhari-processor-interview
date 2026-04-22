# Client — AI Guidance

Optimized for **AI agents**. Four documents cover everything.

| File                                     | When to load                                            |
| ---------------------------------------- | ------------------------------------------------------- |
| [`architecture.md`](./architecture.md)   | Structure, folders, routing, env, composition          |
| [`patterns.md`](./patterns.md)           | API, state, theming/UI — implementation recipes        |
| [`standards.md`](./standards.md)         | Code style, TS, testing, tooling, performance          |
| [`theming.md`](./theming.md)             | Brand palette, typography, spacing, component rules — **source of truth for visual design** |

Active enforcement lives in `client/.cursor/rules/`:

- `core.mdc` — always applied (stack, bans, placement, imports)
- `code.mdc` — auto-attached to `src/**/*.{ts,tsx}`
- `ui.mdc` — auto-attached to `*.{tsx,css}` under `src/`

**Rule of thumb**: the three `.cursor/rules/*.mdc` are the enforceable summary. Load a `.claude/*.md` only when you need a concrete example or the full rationale.

## For agents working in this repo

1. Follow every rule in `.cursor/rules/`.
2. If you need an example or deeper context, read the matching `.claude/` doc.
3. If a user request conflicts with a rule, push back briefly and propose the compliant alternative.

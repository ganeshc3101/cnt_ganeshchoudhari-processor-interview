# Theming — Design System

Brand inspiration: **SignaPay** (https://signapay.com) — a payments platform. The system pairs an **energetic orange primary** with a **cyan-blue secondary**, anchored by **deep navy** surfaces and neutral grays for a trust-forward fintech feel.

> **This file is the single source of truth for visual design.**
> Implementation recipes (token file layout, `ThemeProvider`, component skeletons) live in `patterns.md` §3. When either file changes, update both in the same PR.

---

## 1. Color

### 1.1 Brand

| Role            | Hex       | Use                                                   |
| --------------- | --------- | ----------------------------------------------------- |
| `primary-500`   | `#F26122` | Primary CTAs, key brand moments, focus highlights     |
| `primary-600`   | `#D94E12` | Hover/active for primary                              |
| `primary-100`   | `#FFE7D8` | Selected row, subtle badge, tinted callout            |
| `secondary-500` | `#00A0DD` | Secondary CTAs, links, info highlights                |
| `secondary-700` | `#0E4C90` | Deep accent, on-light headings                        |
| `accent-900`    | `#0C1D26` | App header/footer, dark surfaces                      |
| `accent-800`    | `#122F4F` | Sidebar, hero, elevated dark surface                  |

### 1.2 Neutrals

| Role          | Hex       | Notes                |
| ------------- | --------- | -------------------- |
| `neutral-0`   | `#FFFFFF` | Surface base         |
| `neutral-50`  | `#F7F9FC` | Canvas (page bg)     |
| `neutral-100` | `#EDF3FF` | Brand-tinted surface |
| `neutral-200` | `#D3E1ED` | Border / divider     |
| `neutral-500` | `#6B7076` | Muted text           |
| `neutral-700` | `#4A4C50` | Default body text    |
| `neutral-900` | `#0C1D26` | Strong text, headings |

### 1.3 Semantic (the only tokens feature code may use)

| Token                    | Light value     | Purpose                          |
| ------------------------ | --------------- | -------------------------------- |
| `--color-bg-canvas`      | `neutral-50`    | Page background                  |
| `--color-bg-surface`     | `neutral-0`     | Cards, panels, modals            |
| `--color-bg-surface-alt` | `neutral-100`   | Subtle surface, table zebra      |
| `--color-fg-primary`     | `neutral-900`   | Headings, emphasis               |
| `--color-fg-secondary`   | `neutral-700`   | Body text                        |
| `--color-fg-muted`       | `neutral-500`   | Caption, placeholder             |
| `--color-border`         | `neutral-200`   | Dividers, input borders          |
| `--color-focus-ring`     | `primary-500`   | Keyboard focus outline           |
| `--color-success-500`    | `#1F9D55`       | Positive confirmation            |
| `--color-warning-500`    | `#D97706`       | Caution                          |
| `--color-danger-500`     | `#C53F05`       | Errors, destructive actions      |
| `--color-info-500`       | `secondary-500` | Informational messaging          |

**Rules**

- Feature code consumes **semantic tokens only**. Brand/neutral scales are composed in `tokens.css` and nowhere else.
- Never hardcode hex, `rgb()`, or `hsl()` in feature CSS.
- Dark mode: every semantic token MUST have a `[data-theme='dark']` variant (see patterns.md §3.1–§3.2).

---

## 2. Typography

**Families**

- Display / headings → **Poppins** (500, 600)
- Body / UI → **Inter** (400, 500, 600)
- Mono → `JetBrains Mono`, `ui-monospace` (amounts, ids, code)

Loaded via `<link>` in `index.html` with `display=swap`; always include a system fallback stack.

**Scale (rem, root = 16px)**

| Token           | Size    | Typical use                    |
| --------------- | ------- | ------------------------------ |
| `font-size-xs`  | `0.75`  | Helper text, captions          |
| `font-size-sm`  | `0.875` | Secondary UI, table cells      |
| `font-size-md`  | `1`     | Body default                   |
| `font-size-lg`  | `1.125` | Emphasised body                |
| `font-size-xl`  | `1.25`  | `h3` — section title           |
| `font-size-2xl` | `1.5`   | `h2` — page section            |
| `font-size-3xl` | `1.875` | `h1` — in-app page title       |
| `font-size-4xl` | `2.25`  | `h1` — marketing / hero        |

**Weights** `regular 400 · medium 500 · semibold 600 · bold 700`
**Line heights** `tight 1.2` (headings) · `normal 1.5` (body) · `relaxed 1.75` (long copy)

**Hierarchy rules**

- Exactly one `<h1>` per page. Never skip heading levels.
- Default heading weight is `semibold`; reserve `bold` for hero moments.
- Emphasise body copy with weight, not size.

---

## 3. Spacing

4-pt base grid. Every padding, margin, and gap comes from this scale — no raw `px`, `em`, or `rem`.

| Token      | px  |
| ---------- | --- |
| `space-1`  | 4   |
| `space-2`  | 8   |
| `space-3`  | 12  |
| `space-4`  | 16  |
| `space-5`  | 20  |
| `space-6`  | 24  |
| `space-8`  | 32  |
| `space-10` | 40  |
| `space-12` | 48  |
| `space-16` | 64  |

**Rhythm**

- Controls (buttons, inputs): padding `space-2` / `space-3`.
- Cards: padding `space-6`, internal gaps `space-4`.
- Stacked page sections: `space-8`+ apart.

---

## 4. Radii · elevation · motion

| Radii          | Value    | Use                              |
| -------------- | -------- | -------------------------------- |
| `radius-sm`    | `2px`    | Chips, skeleton bars             |
| `radius-md`    | `6px`    | Buttons, inputs (default)        |
| `radius-lg`    | `10px`   | Cards, modals                    |
| `radius-xl`    | `16px`   | Hero panels                      |
| `radius-full`  | `9999px` | Pills, avatars                   |

| Shadow        | Use                              |
| ------------- | -------------------------------- |
| `shadow-sm`   | Subtle lift (focused input)      |
| `shadow-md`   | Cards, popovers                  |
| `shadow-lg`   | Modals, command palettes         |

| Motion              | Value                        |
| ------------------- | ---------------------------- |
| `duration-fast`     | `120ms`                      |
| `duration-normal`   | `200ms`                      |
| `duration-slow`     | `320ms`                      |
| `ease-standard`     | `cubic-bezier(0.2, 0, 0, 1)` |

Respect `prefers-reduced-motion`. Keep transitions ≤ 200ms; no auto-moving content.

---

## 5. Layout

### 5.1 App shell

```
┌──────────────────────────────────────────────┐
│ Header  (--app-header-h = 64px)              │  surface or accent-900
├──────────────────────────────────────────────┤
│                                              │
│ Main (max-width --container-max = 1280px)    │
│      padding: --space-8 --space-6            │
│                                              │
└──────────────────────────────────────────────┘
```

- Centered content column, max `1280px`, horizontal padding `space-6`.
- Vertical rhythm between sections: `space-8`+.
- Sidebar (when introduced): `--app-sidebar-w = 256px`.

### 5.2 Breakpoints (mobile-first)

| Token   | Min width |
| ------- | --------- |
| `bp-sm` | `640px`   |
| `bp-md` | `768px`   |
| `bp-lg` | `1024px`  |
| `bp-xl` | `1280px`  |

Write base styles for the smallest screen first; layer enhancements with `min-width` queries.

---

## 6. Components (high-level rules)

Implementation skeletons live in `patterns.md` §3.3–§3.5. Rules here apply to **every** component authored.

### 6.1 Buttons

- Variants: **primary** (filled `primary-500`), **secondary** (outlined `border`), **ghost** (text-only), **danger** (filled `danger-500`).
- Sizes: `sm 32px` · `md 40px` (default) · `lg 48px`.
- Always render `type="button"` unless submitting a form.
- On `primary-500` backgrounds, label is `neutral-0` only.
- Disabled: `opacity: 0.6`, `cursor: not-allowed`, retains readable contrast.
- Loading: set `aria-busy="true"`, swap label for spinner, keep width stable.

### 6.2 Inputs

- Height matches button size scale (default `40px`).
- Border `1px --color-border`; focus → `2px --color-focus-ring` outline, `2px` offset.
- A visible `<label>` is required. Placeholder is never a label.
- Error: `aria-invalid="true"`, red border, helper text in `--color-danger-500`, `aria-describedby` linking to the message.
- Validation: React Hook Form + Zod (patterns.md §2.4).

### 6.3 Cards / panels

- Surface `--color-bg-surface`, border `1px --color-border`, radius `--radius-lg`, padding `--space-6`.
- Card header / body / footer stack with `--space-4` gaps.
- Do not nest cards. Promote to a page section instead.

### 6.4 Feedback (toasts, banners, alerts)

- Use the semantic intent color (`success` / `warning` / `danger` / `info`).
- Icon + text (+ optional action). Color must never be the only signal.

---

## 7. Required UX states

Every data-bound view renders **all four** states from `shared/ui/`:

| State    | Component                             | Rule                                                           |
| -------- | ------------------------------------- | -------------------------------------------------------------- |
| Loading  | `<Skeleton />` / `<PageSkeleton />`   | Match final layout shape; avoid spinners above 200ms           |
| Error    | `<ErrorState onRetry />`              | Human message + retry; never show raw error strings            |
| Empty    | `<EmptyState />`                      | Icon + one-line explanation + clear next-step CTA              |
| Success  | The real UI                           | —                                                              |

Buttons/inputs mid-action use `disabled` + `aria-busy`; they do **not** swap to a different component.

---

## 8. Accessibility (theme-level)

- Body text contrast ≥ **4.5:1**; large text ≥ **3:1**.
- Keyboard focus is always visible — 2px `--color-focus-ring` outline with 2px offset. Never remove focus styles without a replacement.
- Color is never the sole signal; pair with icon or text.
- Dark mode is a first-class theme, not an afterthought — every token ships both variants.

---

## 9. Consistency checklist (agents, before finishing a UI change)

- [ ] No raw hex / rgb / hsl in the diff.
- [ ] No raw spacing (`px`, `em`) outside `tokens.css`.
- [ ] Font family inherits from body — no ad-hoc `font-family`.
- [ ] All four UX states (loading, error, empty, success) are handled for data-bound views.
- [ ] Focus styles present on every interactive element.
- [ ] Works in light and dark mode.

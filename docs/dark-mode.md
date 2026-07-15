# Dark Mode — Sweep Cheat-Sheet

Status: **foundation complete** (tokens, activation, toggle, global base styles,
UI kit). Page-level sweeps are the next phase — this document is the reference
those sweeps should follow. It assumes you're comfortable with Tailwind's
`dark:` variant; the only non-standard thing here is *how* dark mode is
activated (attribute, not the default `.dark` class) and the site-specific
token names.

Read this top to bottom before sweeping a page. The "hard gates" section at
the end lists things that must never happen.

## 1. How activation works

- `darkMode: ['selector', '[data-theme="dark"]']` in `tailwind.config.mjs`
  (Tailwind 3.4.15 `selector` strategy). Every `dark:` utility compiles to
  `[data-theme="dark"] &`. It is **not** the classic `.dark` class strategy.
- `data-theme="light"` or `data-theme="dark"` is set on `<html>` by an inline,
  `is:inline` no-FOUC script in `src/layouts/BaseLayout.astro`, which runs
  before first paint. Priority: `localStorage.theme` → `prefers-color-scheme`
  fallback.
- `window.__setTheme(theme, persist = true)` is the single source of truth for
  changing theme at runtime. It sets the attribute, persists to
  `localStorage` (unless `persist` is `false`), and fires a
  `document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))`.
  **Never** set `data-theme` directly from page code — call `__setTheme`, or
  read the current value via `document.documentElement.getAttribute('data-theme')`.
- Cross-tab sync: a `storage` event listener re-applies theme when
  `localStorage.theme` changes in another tab.
- OS-preference sync: a `matchMedia('(prefers-color-scheme: dark)')` listener
  only fires when there is **no stored preference** — once a user has an
  explicit choice, OS changes are ignored (by design).
- `color-scheme` (native form controls/scrollbar) is set via CSS in
  `global.css`, tied to `[data-theme='dark']`, not a static meta tag — so it
  always matches the *active* theme, not raw OS state.

## 2. Toggle architecture

`src/components/layout/ThemeToggle.astro` is framework-free (no React) and
safe to render multiple times per page (desktop header + mobile menu both do
this). Multiple instances share:

- one delegated `click` listener bound once globally (guarded by
  `window.__themeToggleBound`)
- one `themechange` listener that re-syncs `aria-pressed` on every instance
  via the shared `.theme-toggle` class

If you need a new toggle placement, just drop `<ThemeToggle />` in — don't
write new JS for it.

## 3. Token reference

Defined in `tailwind.config.mjs`. Hex values are used everywhere (not
`oklch()` strings) for opacity-modifier (`/10`, `/20`, …) compatibility across
browsers; each token's OKLCH source is documented as an inline comment next to
its hex value in the config.

| Token | Hex | Use |
|---|---|---|
| `coffee-sunk` | `#0f0704` | inputs/wells, code blocks, recessed surfaces |
| `coffee-page` | `#190f09` | `<body>` background |
| `coffee-raised` | `#271d15` | cards, panels, header/footer surfaces |
| `coffee-raised2` | `#332619` | popovers, dropdowns, hover-raised state |
| `coffee-border` | `#362b23` | hairline borders, dividers |
| `coffee-border-strong` | `#4d3f33` | emphasized borders, focus-adjacent |
| `cream-primary` | `#ede3d5` | headings, primary text |
| `cream-secondary` | `#c4b4a3` | body copy, descriptions |
| `cream-muted` | `#8f8578` | captions, meta text, hints |
| `cream-inverse` | `#f3eadd` | **footer only** — see cream-inverse-band rule below |
| `gold` | `#d8a16c` | link-hover underline decoration + blockquote/citation accents ONLY |
| `crystal-400`/`crystal-300` | existing scale | primary accent in dark mode (links, focus rings, active nav) |

Gem hues (`red`, `blue`, `green`, `purple`, `amber`, etc. — used for Badge/IconBox
variants) keep their existing Tailwind palette; dark mode uses the **alpha-tint
pattern** on top of them (see below), it does not introduce new gem tokens.

## 4. Standard class replacements

Use these as the default mapping when sweeping a page. Deviate only when a
component already has a documented reason not to (e.g. specimen-plate rule).

| Light-mode class | Add this dark: variant |
|---|---|
| `bg-white` | `dark:bg-coffee-raised` (surfaces) or `dark:bg-coffee-page` (page-level full-bleed sections) |
| `bg-slate-50` | `dark:bg-coffee-raised2` (usually a hover/alt-row bg) — check context, occasionally `dark:bg-coffee-sunk` for recessed/code areas |
| `bg-slate-100` | `dark:bg-coffee-raised2` |
| `text-slate-900` | `dark:text-cream-primary` |
| `text-slate-700` / `text-slate-800` | `dark:text-cream-secondary` |
| `text-slate-600` | `dark:text-cream-secondary` |
| `text-slate-500` | `dark:text-cream-muted` |
| `border-slate-200` | `dark:border-coffee-border` |
| `border-slate-300` | `dark:border-coffee-border-strong` |
| `hover:bg-slate-50` / `hover:bg-slate-100` | `dark:hover:bg-coffee-raised2` |
| `hover:text-slate-900` | `dark:hover:text-cream-primary` |
| `focus-visible:ring-crystal-500` | add `dark:focus-visible:ring-crystal-400` alongside (keep the light ring too) |
| `text-crystal-700` (as a link/accent) | `dark:text-crystal-400`, hover `dark:hover:text-crystal-300` |
| `bg-crystal-700` (primary button) | `dark:bg-crystal-600 dark:hover:bg-crystal-500` (deliberately one step lighter, not `crystal-700`/`800`, for dark-surface contrast) |

General rule: **add** `dark:` variants alongside existing light classes — never
replace/remove a light class. The light look must stay pixel-identical when
`data-theme` is absent or `"light"`.

## 5. Badge / IconBox alpha-tint pattern

For any small colored chip/icon container keyed to a semantic or gem hue, the
dark-mode form is always:

```
dark:bg-{hue}-400/10 dark:text-{hue}-300 dark:border dark:border-{hue}-400/20
```

(IconBox omits the border — it's a plain tinted container, not a bordered
chip: `dark:bg-{hue}-400/10 dark:text-{hue}-300` only.)

This applies uniformly to all semantic variants (success/warning/danger, the
gem hues ruby/sapphire/emerald/amethyst/topaz, and the crystal-system variants
cubic/hexagonal/trigonal/tetragonal/orthorhombic/monoclinic/triclinic). Do not
invent a different treatment per hue — swap `{hue}` and keep the pattern.

`default`/`outline`/`slate`-style neutral badges use the coffee/cream surface
tokens instead (e.g. `dark:bg-coffee-raised2 dark:text-cream-secondary`), since
they aren't tied to a semantic hue.

Reference implementations: `src/components/ui/Badge.tsx`,
`src/components/ui/DifficultyBadge.tsx`, `src/components/ui/IconBox.tsx`, and
their `.astro` mirrors in `src/components/ui-astro/`.

## 6. Crystal-SVG "specimen plate" rule

Any container that renders a crystal/mineral SVG or 3D view (`.crystal-svg-container`
and equivalent) **stays permanently light**, regardless of theme. Real
specimens are photographed/rendered against a neutral light background —
inverting it would misrepresent the material and break color-accuracy for
gemmological identification. The only dark-mode addition allowed there is a
subtle border so the plate doesn't look like a stray white rectangle floating
on a dark page:

```
dark:border dark:border-coffee-border
```

Do **not** add `dark:bg-*` to specimen-plate containers. This is a hard rule,
not a style preference — see `global.css` for the existing comment on
`.crystal-svg-container`.

## 7. Shadow + border rule

Light-mode shadows (`shadow-sm`, `shadow-md`, etc.) read as muddy smudges on
dark coffee surfaces and should not be relied on for elevation in dark mode.
Prefer a **border** to communicate edges/elevation in dark mode instead:

- Card/panel elevation in dark mode = `dark:border-coffee-border` (already on
  `.card`), optionally `dark:border-coffee-border-strong` for a more
  prominent panel.
- Don't bother adding `dark:shadow-none` defensively unless a specific shadow
  is visibly wrong in a manual check — most existing shadows are low-opacity
  enough to pass, but if you see a smudge, drop the shadow class in dark mode
  and lean on the border instead.
- Hover-elevation (`.card-hover`) uses a lighter-still raised background
  (`dark:hover:bg-coffee-raised2`) plus an accent border tint
  (`dark:hover:border-crystal-400/40`) rather than a bigger shadow.

## 8. The one cream-inverse-band exception

`src/components/layout/Footer.astro` is the **only** place in the site that
flips to a light cream surface (`cream-inverse`, `#f3eadd`) with dark
coffee-ink text in dark mode. This is a deliberate jewlarray.ch signature
echo. It must remain unique — do not reuse `cream-inverse` or the "light
surface embedded in a dark page" pattern anywhere else. If a future design
wants to echo it again, treat that as a design decision requiring explicit
spec sign-off, not a default sweep move.

## 9. UI kit coverage (already done — reuse, don't re-style)

All components in `src/components/ui/` (React) and `src/components/ui-astro/`
(Astro mirrors, used by ~20 pages) already carry full dark-mode variants for
every interactive state (hover/focus/active/disabled):
`Button`, `Card`, `Badge`, `DifficultyBadge`, `IconBox`, `Link`, `SectionHeader`,
`Table`/`DataTable`/`PropertyTable`/`PaginatedTable`, `SearchInput`.
`Container` intentionally carries no color classes and needs none.

**When sweeping pages: prefer swapping raw Tailwind color classes for these
components outright** rather than hand-rolling dark: variants inline. If a
page uses raw `<div className="rounded-xl border ...">` instead of `<Card>`,
consider migrating it to the shared component as part of the sweep — it's
less work than maintaining a one-off dark treatment.

## 10. Known gaps (explicitly out of foundation scope)

These are real gaps, not oversights — they need page/feature-specific work by
the sweep agents that own those surfaces:

- **Monaco / CDL playground editor theme.** The spec calls for switching the
  Monaco editor to a dark theme (`vs-dark`) when `data-theme="dark"`. This is
  JS wiring inside the playground's editor-mounting code (likely reacting to
  the `themechange` document event and calling
  `monaco.editor.setTheme('vs-dark' | 'vs')`), not a CSS/token concern. Not
  implemented — needs to be picked up by whoever sweeps `/playground`.
- **`.prose` / typography-plugin dark styling.** Learn articles and other
  markdown-rendered content use `@tailwindcss/typography`'s `prose` classes,
  which currently have no dark counterpart wired up (`prose-invert` is
  available from the plugin but not configured, and the custom
  `typography.extend` overrides in `tailwind.config.mjs` — list styling,
  code blocks, etc. — have hardcoded light colors, e.g. the `ol > li::before`
  counter badge and `ul > li` border colors). This needs its own
  `dark:prose-invert` pass plus dark equivalents for the customized
  `typography.extend.DEFAULT.css` / `.lg.css` overrides. Not implemented —
  needs to be picked up by whoever sweeps `/learn`.

## 11. Hard gates (do not violate)

1. Light mode must remain **pixel-identical** when `data-theme` is absent or
   `"light"`. Every change is additive (`dark:` variants only).
2. Never invert crystal/mineral specimen SVG plates (see §6).
3. `cream-inverse` / light-surface-in-dark-page pattern is used **exactly
   once** (Footer) — see §8.
4. `gold` is only ever a link-hover underline decoration or blockquote/citation
   accent — never body text color, never text-on-gold or gold-on-text without
   dark ink (`coffee-sunk`) underneath.
5. Don't add a global CSS transition on color/background for the theme switch
   — the toggle switches instantly. Only the toggle's own icon crossfade
   (150ms, disabled under `prefers-reduced-motion`) animates.
6. Always add `dark:focus-visible:ring-crystal-400` (or the ring color already
   in use) next to any existing `focus-visible:ring-*` — don't let focus rings
   disappear or go invisible against dark surfaces.
7. Don't set `data-theme` or touch `localStorage.theme` directly from new
   code — always go through `window.__setTheme`.

## 12. File map (foundation layer)

- `tailwind.config.mjs` — `darkMode` config, `coffee`/`cream`/`gold` tokens
- `src/layouts/BaseLayout.astro` — no-FOUC script, `__setTheme`, `themechange`
- `src/components/layout/ThemeToggle.astro` — the toggle button
- `src/components/layout/Header.astro` — toggle placement (desktop + mobile), dark nav
- `src/components/layout/Footer.astro` — cream-inverse-band (§8)
- `src/styles/global.css` — dark base layer (body, headings, `.btn`, `.card`,
  `.input`, selection, scrollbars), `color-scheme` CSS, specimen-plate rule
- `src/components/ui/*.tsx` and `src/components/ui-astro/*.astro` — UI kit
  dark variants (§9)

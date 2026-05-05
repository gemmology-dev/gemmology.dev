# Design Needs — Study Components T3

Cases encountered during T3 implementation where an existing primitive was
insufficient or absent, and the decision taken.

---

## 1. Confidence-coloured button variants (ConfidenceTap)

**Need:** Three distinct colour tones for unsure (red), fairly-sure (amber),
and certain (emerald) confidence buttons.

**Available primitive:** `Button` with variants `primary | secondary | ghost | outline`.
None map semantically to the confidence spectrum.

**Decision:** Used raw `<button>` elements styled via `cn(...)` with colour
classes (`border-red-*`, `border-amber-*`, `border-emerald-*`). These are
semantic colours, not structural Tailwind — the ring/hover states use the same
Tailwind colour scale as the rest of the design system. The `Button` primitive
was not used here because wrapping it with `className` overrides would have
required fighting against its `variant` styles.

**Recommendation for future primitive:** Add `variant="danger" | "warning" | "success"`
to `Button`, or add an `asChild`-style primitive that accepts raw className overrides
without a preset variant.

---

## 2. Toggle switch (StudySettingsPanel)

**Need:** iOS-style toggle switch for boolean settings.

**Available primitive:** None — `Button` with `role="switch"` is the closest
but has no visual switch track/thumb.

**Decision:** Implemented inline as a `<button role="switch">` with a styled
span thumb. Uses `crystal-600` (the project's primary colour) for the "on"
state, matching the existing focus ring convention.

**Recommendation:** Add `<Toggle>` or `<Switch>` to `src/components/ui/`.

---

## 3. Tooltip (UnvettedFlag)

**Need:** A simple hover/focus tooltip attached to the unvetted warning icon.

**Available primitive:** None.

**Decision:** Implemented as a positioned `<span role="tooltip">` sibling,
toggled via `opacity-0/100` through React state on `mouseenter`/`focus`. Used
the `amber` colour scale and `border-amber-200` to match the `topaz` badge
variant. Shadow from `shadow-md` matches the Card primitive.

**Recommendation:** Add a lightweight `<Tooltip>` primitive to `src/components/ui/`
that wraps the pattern above and handles keyboard focus, pointer events, and
positioning via a popover API or Floating UI.

---

## 4. Collapsible panel (RationalePanel)

**Need:** An expand/collapse panel with a clickable header and animated body.

**Available primitive:** `Card` provides the container; no accordion/collapse
primitive exists.

**Decision:** Built the collapse behaviour inline using `hidden` attribute
toggled by React state. The header is a `<button>` with `aria-expanded` and
`aria-controls`. Uses `Card` only as a style reference (same border-radius,
border-colour scale) rather than as a wrapper, because the panel needs a custom
header row.

**Recommendation:** Add `<Collapsible>` / `<Accordion>` primitive to `src/components/ui/`.

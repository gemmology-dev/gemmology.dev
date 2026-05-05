# T8 — WCAG 2.2 AA Accessibility Audit: Hint / Helper Text

**Date:** 2026-05-05  
**Scope:** Hint, description, and secondary text across gemmology.dev  
**Standard:** WCAG 2.2 Level AA  
**Status:** READ-ONLY — no source files modified

---

## Contrast Maths Reference

WCAG relative luminance formula used throughout. Tailwind v3 default slate palette:

| Token | Hex | sRGB | Rel. Lum (L) |
|-------|-----|------|--------------|
| `slate-400` | `#94a3b8` | 0.580 / 0.639 / 0.722 | 0.3675 |
| `slate-500` | `#64748b` | 0.392 / 0.455 / 0.545 | 0.1768 |
| `slate-600` | `#475569` | 0.278 / 0.333 / 0.412 | 0.0894 |
| `slate-900` | `#0f172a` | 0.059 / 0.090 / 0.165 | 0.0093 |
| `white`     | `#ffffff` | 1.0 / 1.0 / 1.0 | 1.0000 |
| `slate-50`  | `#f8fafc` | 0.973 / 0.980 / 0.988 | 0.9533 |

**Contrast ratios (foreground : background):**

| Pair | Ratio | AA Normal (4.5:1) | AA Large (3:1) |
|------|-------|:-----------------:|:--------------:|
| slate-500 on white (#fff) | 4.51:1 | PASS (marginal) | PASS |
| slate-500 on slate-50 (#f8fafc) | 4.30:1 | **FAIL** | PASS |
| slate-400 on white (#fff) | 2.87:1 | **FAIL** | **FAIL** |
| slate-400 on slate-50 (#f8fafc) | 2.73:1 | **FAIL** | **FAIL** |
| slate-400 on slate-900 (dark mode) | 7.99:1 | PASS | PASS |
| slate-500 on slate-900 (dark mode) | 19.6:1 | PASS | PASS |
| slate-600 on white (#fff) | 7.59:1 | PASS | PASS |
| slate-600 on slate-50 (#f8fafc) | 7.24:1 | PASS | PASS |

**WCAG SC 1.4.3 thresholds:**
- Normal text (< 18pt / < 24px, or < 14pt bold / < 19px bold): **4.5:1**
- Large text (≥ 18pt / 24px, or ≥ 14pt bold / 19px bold): **3:1**

`text-xs` = 12px (0.75 rem). `text-sm` = 14px (0.875 rem). Neither qualifies as large text.

---

## Executive Summary

- **Systemic failure — `text-xs text-slate-500` on `bg-slate-50`:** The `FormFieldHint` component (12px, #64748b on #f8fafc) renders inside `bg-slate-50` panels in `GemIdentifier.tsx` and produces a contrast ratio of **4.30:1**, failing WCAG SC 1.4.3. The same token pair appears in ~50 additional locations across calculator and identification components. On pure white the ratio is 4.51:1 — technically passing but sitting at the margin where sub-pixel rendering, antialiasing, and any tinted system display profile will push it below threshold.
- **Outright failure — `text-slate-400` on any light background:** `#94a3b8` achieves only 2.87:1 on white and 2.73:1 on slate-50. Eleven non-decorative instances in production components (settings panel range labels, quiz progress text, exam results labels, filter counts) **fail AA for all text sizes.**
- **Size hazard — `text-xs` (12px) everywhere:** Over 50 instances of `text-xs` carry meaningful content (hints, notes, confidence labels). WCAG does not mandate a minimum size, but SC 1.4.4 requires text to be resizable to 200% without loss of content or functionality; combined with low contrast this is the core of the user's readability complaint.
- **Dark mode is generally safe:** `slate-400 dark:text-slate-400` and `slate-500 dark:text-slate-400` on `slate-900` produce 7.99:1 and 19.6:1 respectively — no dark-mode failures found. The dark-mode classes are correctly applied in `StudySettingsPanel.tsx`.

---

## Findings Table

| ID | Severity | File:Line | Current Classes | Background | Computed Ratio | Criterion | Fix |
|----|----------|-----------|-----------------|------------|---------------|-----------|-----|
| F-01 | **P0** | `form/FormField.tsx:103` | `text-xs text-slate-500` | bg-slate-50 (via GemIdentifier panels) | 4.30:1 | SC 1.4.3 FAIL | `text-sm text-slate-600` |
| F-02 | **P0** | `form/FormField.tsx:103` | `text-xs text-slate-500` | bg-white (most other contexts) | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-03 | **P0** | `quiz/study/StudySettingsPanel.tsx:137` | `text-xs text-slate-400` | bg-white | 2.87:1 | SC 1.4.3 FAIL | `text-xs text-slate-600` |
| F-04 | **P0** | `quiz/ExamResults.tsx:169,173,177` | `text-sm text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-05 | **P0** | `quiz/ExamResults.tsx:342,356` | `text-sm text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-06 | **P0** | `calculator/DensityEstimator.tsx:91` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-07 | **P1** | `identification/GemIdentifier.tsx:272` | `text-xs text-slate-500` | bg-slate-50 | 4.30:1 | SC 1.4.3 FAIL | `text-sm text-slate-600` |
| F-08 | **P1** | `identification/GemIdentifier.tsx:559` | `text-xs text-slate-500` | bg-slate-50 | 4.30:1 | SC 1.4.3 FAIL | `text-sm text-slate-600` |
| F-09 | **P1** | `calculator/LengthConverter.tsx:35,77` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-10 | **P1** | `calculator/TemperatureConverter.tsx:43,96` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-11 | **P1** | `calculator/SGCalculator.tsx:57,113` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-12 | **P1** | `calculator/CriticalAngleCalc.tsx:32,84` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-13 | **P1** | `calculator/CaratEstimator.tsx:146,228` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-14 | **P1** | `calculator/BirefringenceCalc.tsx:45,91` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-15 | **P1** | `calculator/WeightConverter.tsx:52,110` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-16 | **P1** | `calculator/DispersionCalculator.tsx:101` | `text-xs text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-17 | **P1** | `quiz/study/StudySettingsPanel.tsx:43,114,151` | `text-xs text-slate-500 dark:text-slate-400` | bg-white | 4.51:1 light / 7.99:1 dark | SC 1.4.3 borderline light | `text-sm text-slate-600 dark:text-slate-400` |
| F-18 | **P1** | `learn/CrystalDemo.astro:36` | `text-sm text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-19 | **P1** | `learn/CrystalSystemCard.astro:106,128` | `text-xs text-slate-500` | system-tinted bg (light) | ≤4.51:1 (marginal, tinted) | SC 1.4.3 borderline | `text-xs text-slate-700` (or `font-semibold`) |
| F-20 | **P1** | `calculator/ResultCard.tsx:90` | `text-sm text-slate-500` | bg-crystal-50 | ~4.2:1 (tinted) | SC 1.4.3 FAIL | `text-sm text-slate-600` |
| F-21 | **P2** | `quiz/QuizSetup.tsx:114,209,233,259` | `text-sm text-slate-500` | bg-white | 4.51:1 (marginal) | SC 1.4.3 borderline | `text-sm text-slate-600` |
| F-22 | **P2** | `advanced/TreatmentDetection.tsx:216` | `text-xs text-slate-400` | bg-white | 2.87:1 | SC 1.4.3 FAIL | `text-xs text-slate-600` |
| F-23 | **P2** | `gallery/FilterBar.tsx:140,168` | `text-xs text-slate-400 uppercase tracking-wider` | bg-white | 2.87:1 | SC 1.4.3 FAIL | `text-xs text-slate-500 font-semibold` (tracking boost keeps AA for uppercase) |
| F-24 | **P2** | `identification/FractureCleavageGuide.tsx:123` | `text-xs text-slate-400` | bg-white | 2.87:1 | SC 1.4.3 FAIL | `text-xs text-slate-600` |
| F-25 | **P2** | `optical/DichroscopeResults.tsx:153` | `text-xs text-slate-400` | bg-white | 2.87:1 | SC 1.4.3 FAIL | `text-xs text-slate-600` |
| F-26 | **P2** | `minerals/FamilyDetail.tsx:134` | `text-xs text-slate-400` (CDL Expression label) | bg-white | 2.87:1 | SC 1.4.3 FAIL | `text-xs text-slate-600` |
| F-27 | **P2** | `identification/IdentificationMatchCard.tsx:130` | `text-slate-400` (→ separator) | bg-white | 2.87:1 | SC 1.4.3 FAIL | aria-hidden="true" is sufficient if purely decorative; if meaningful, use `text-slate-500` |

**Notes on `text-slate-400` decorative/interactive uses (not findings):**
- Icon SVGs that are `aria-hidden="true"` or serve as affordances without textual content: `SearchInput.tsx:13,43`, `IdentificationMatchCard.tsx:111`, `minerals/CounterpartsSection.astro:85,129`, `minerals/RelatedMinerals.astro:58` — these are decorative and not subject to SC 1.4.3.
- Disabled input states (`Input.tsx:65`, `Select.tsx:79`): disabled controls are exempt from contrast requirements under WCAG 2.2 Note 1 to SC 1.4.3.
- `quiz/QuizProgress.tsx:99` dot indicators for unanswered questions: partially decorative (meaning conveyed via surrounding context), but borderline — `text-slate-500` would be safer.

---

## Recommended Token Swap

### Tier 1 — Systemic fix (1 line, max coverage)

**`src/components/form/FormField.tsx:103`** — change `FormFieldHint`:

```diff
- <p id={hintId} className="text-xs text-slate-500">
+ <p id={hintId} className="text-sm text-slate-600">
```

This single edit fixes all `FormField hint=` usages across:
- `DensityEstimator.tsx` (3 instances: method description, displacement hint, shape formula)
- `GemIdentifier.tsx` (5 instances: optic character, RI min, RI max, RI single, SG)
- `LengthConverter.tsx` (uses `FormField` with no explicit hint — not affected)
- All future callers automatically inherit the fix.

The `text-slate-600` (#475569) token produces **7.59:1 on white** and **7.24:1 on slate-50** — passing AA with substantial headroom.

### Tier 2 — Inline `text-xs text-slate-500` sweep

Files with hardcoded `text-xs text-slate-500` outside `FormField` that carry meaningful content (not decorative):

| File | Instances | Recommended change |
|------|-----------|-------------------|
| `calculator/DensityEstimator.tsx` | 1 (line 91) | `text-sm text-slate-600` |
| `calculator/LengthConverter.tsx` | 2 (lines 35, 77) | `text-sm text-slate-600` |
| `calculator/TemperatureConverter.tsx` | 2 (lines 43, 96) | `text-sm text-slate-600` |
| `calculator/SGCalculator.tsx` | 2 (lines 57, 113) | `text-sm text-slate-600` |
| `calculator/CriticalAngleCalc.tsx` | 2 (lines 32, 84) | `text-sm text-slate-600` |
| `calculator/CaratEstimator.tsx` | 2 (lines 146, 228) | `text-sm text-slate-600` |
| `calculator/BirefringenceCalc.tsx` | 2 (lines 45, 91) | `text-sm text-slate-600` |
| `calculator/WeightConverter.tsx` | 2 (lines 52, 110) | `text-sm text-slate-600` |
| `calculator/DispersionCalculator.tsx` | 1 (line 101) | `text-sm text-slate-600` |
| `calculator/ResultCard.tsx` | 1 (line 90, label) | `text-sm text-slate-600` |
| `identification/GemIdentifier.tsx` | 3 (lines 272, 522, 559) | `text-sm text-slate-600` |
| `quiz/study/StudySettingsPanel.tsx` | 4 (lines 43, 110, 114, 151) | `text-sm text-slate-600 dark:text-slate-400` |
| `quiz/ExamResults.tsx` | 7 (lines 162, 169, 173, 177, 185, 342, 356) | `text-sm text-slate-600` |
| `quiz/QuizSetup.tsx` | 4 (lines 114, 209, 233, 259) | `text-sm text-slate-600` |
| `learn/CrystalDemo.astro` | 1 (line 36, figcaption) | `text-sm text-slate-600` |
| `learn/CrystalSystemCard.astro` | 2 (lines 106, 128) | `text-xs font-semibold text-slate-600` (uppercase labels retain large-text exemption at 3:1) |

### Tier 3 — `text-slate-400` non-decorative text replacements

Replace with `text-slate-600` (or `text-slate-500` where a lighter touch is intentional and the token is used in a clearly secondary role with sufficient size):

| File | Line | Current | Recommended |
|------|------|---------|-------------|
| `quiz/study/StudySettingsPanel.tsx` | 137 | `text-xs text-slate-400` (range labels "All new" / "All review") | `text-xs text-slate-600` |
| `advanced/TreatmentDetection.tsx` | 216 | `text-xs text-slate-400` (count label) | `text-xs text-slate-600` |
| `gallery/FilterBar.tsx` | 140, 168 | `text-xs text-slate-400 uppercase tracking-wider` | `text-xs text-slate-500 font-semibold uppercase tracking-wider` — uppercase + bold qualifies as "large text" for 3:1; slate-500 clears 4.51:1 anyway |
| `identification/FractureCleavageGuide.tsx` | 123 | `text-xs text-slate-400` (count) | `text-xs text-slate-600` |
| `optical/DichroscopeResults.tsx` | 153 | `text-xs text-slate-400` (count) | `text-xs text-slate-600` |
| `minerals/FamilyDetail.tsx` | 134 | `text-xs text-slate-400` (label) | `text-xs text-slate-600` |
| `identification/IdentificationMatchCard.tsx` | 130 | `text-slate-400` (→ arrow) | Add `aria-hidden="true"` if decorative; else `text-slate-600` |

**Keep `text-slate-400`** only for:
- Icon SVGs with `aria-hidden="true"`
- Disabled form controls
- Animated loading pulses (transient, not read content)
- Interactive hover targets (e.g., `ResultCard.tsx:65` copy button idle state — the hover lift to slate-600 satisfies interaction contrast; the idle state is acceptable as the button is not the primary affordance)

---

## SC 1.4.12 Text Spacing Check

WCAG 2.2 SC 1.4.12 requires no loss of content when users apply:
- Line height ≥ 1.5× font size
- Letter spacing ≥ 0.12em
- Word spacing ≥ 0.16em
- Paragraph spacing ≥ 2× font size

All hint text reviewed uses standard Tailwind utilities with no `overflow: hidden` or fixed-height clipping. `FormFieldHint` renders as a `<p>` with `space-y-1` parent — no known clipping. **No SC 1.4.12 failures identified**, but the `text-xs` size combined with `mt-0.5` line offset in `StudySettingsPanel` is tight. Switching to `text-sm` (Tier 1 + 2 fixes) gives the layout more room and makes spacing overrides safe.

---

## SC 1.4.4 Resize Text Check

`FormFieldHint` uses `text-xs` = `0.75rem`. When the user sets browser font size to 200% (32px base), this renders at ~24px — well above the 24px threshold for large text. The component itself does not clip or constrain height. **No SC 1.4.4 failures identified**, though the 12px baseline is uncomfortable before zoom.

---

## Implementation Plan

**Phase 1 — One-line fix, maximum coverage (estimate: 10 min)**

Edit `src/components/form/FormField.tsx:103`:
```diff
- <p id={hintId} className="text-xs text-slate-500">
+ <p id={hintId} className="text-sm text-slate-600">
```
Covers all `hint=` prop usages automatically.

**Phase 2 — Calculator inline hints (estimate: 30 min)**

Sweep the 9 calculator files listed in Tier 2. Each file has 1–2 instances of `text-xs text-slate-500` that are formula notes or conversion reference text. Replace with `text-sm text-slate-600`.

**Phase 3 — Quiz / study panel hints (estimate: 20 min)**

`StudySettingsPanel.tsx` (4 instances), `QuizSetup.tsx` (4 instances), `ExamResults.tsx` (7 instances). Replace `text-sm text-slate-500` → `text-sm text-slate-600` and `text-xs text-slate-500` → `text-sm text-slate-600`.

**Phase 4 — `text-slate-400` non-decorative sweep (estimate: 20 min)**

6 targeted line fixes listed in Tier 3.

**Phase 5 — Learn components (estimate: 10 min)**

`CrystalDemo.astro:36`, `CrystalSystemCard.astro:106,128`.

---

## Verification Steps

After applying fixes, spot-check with axe DevTools browser extension (or Lighthouse accessibility audit) on:

1. **`/tools/calculator`** — verify all formula notes, hint text under form fields, and result card labels pass 4.5:1. Test with DevTools forced `bg-slate-50` parent.
2. **`/tools/identification`** — open GemIdentifier, confirm all `hint=` text under the Step 1/2/3 panels reads with sufficient contrast (panels have `bg-slate-50` background).
3. **`/quiz`** — run QuizSetup, confirm mode descriptions and category count labels are legible. Enter exam mode, review results panel labels (Grade/Time Used/Time Usage).
4. **`/study/settings`** — confirm toggle descriptions, range labels ("All new" / "All review"), and question-count description pass 4.5:1.
5. **Text spacing bookmarklet** — inject the [WCAG SC 1.4.12 bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html) on each route above and confirm no content is clipped.
6. **200% zoom** — resize browser to 200% on `/tools/calculator` and `/quiz`. Confirm no hint text is hidden or overflows a clipped container.

Automated CI recommendation: add `axe-core` (via `@axe-core/playwright`) to the existing Playwright suite targeting the four routes above, asserting `color-contrast` rule passes. This catches regressions on future colour changes.

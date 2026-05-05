# UX Review Implementation — Decisions

**Date:** 2026-05-05
**Source review:** `~/Downloads/gemmology-dev-ux-review-2026-05-05/REPORT.md`

## Scope

Implement every fix from the 2026-05-05 UX review **except**:
- Author byline (#22) — kept dynamic, do not change.
- `LLM-Content:` directive in `robots.txt` (#51) — keep as-is.

## Open decisions, resolved

1. **Lock gate** → remove entirely. Delete `LockGate.tsx`, unwrap all `Protected*` wrappers, remove the access-request form and its API endpoint. Admin auth stays intact (separate concern).
2. **Access-request form fate** → delete. Footer GitHub link is sufficient for feedback; a half-orphaned form would rot.
3. **Gallery DB strategy** → option B, build-time SSG. Astro renders the 159 mineral cards as static HTML at build time (no client-side database for the default view). Filters that map to URL params become pre-rendered routes; sql.js + the full SQLite DB lazy-load only when a user opens search or a complex multi-criteria filter.

## Execution model

- One worktree per workstream under `.trees/`, per project's GitHub Flow rules.
- Pre-flight: merge any unmerged-but-ready local branches to `main` first, so all subsequent worktrees branch off a current base. Verify each branch is genuinely unmerged (check by-PR history, not just commit presence on `main`) before merging.
- Wait for the deployed `main` to refresh, re-audit what's still outstanding, then plan the residual work.
- Three execution waves, parallelised where independent. User has authorised launching all waves directly after one another with no mid-wave check-in.

## Workstreams (initial plan, will be adjusted after re-audit)

| ID | Branch | Items |
|----|--------|-------|
| W1 | `feature/remove-lock-gate` | 1 |
| W2 | `fix/csp-headers` | 2 |
| W3 | `feature/gallery-ssg` | 5, 7, 16 (already done), 36, 56, 57 |
| W4 | `feature/playground-shell` | 4, 8, 44 |
| W5 | `fix/contrast-and-dark-mode` | 3, 30, 37 |
| W6 | `refactor/design-primitives` | 34, 35, 59, 60 |
| W7 | `feat/copy-rewrite` | 12, 13, 14, 15, 17, 18, 19, 20, 21, 50 |
| W8 | `feat/eeat-and-content` | 23 (skipped — author dynamic), 24–29, 33, 45, 46, 47 |
| W9 | `chore/visual-and-a11y-polish` | 6, 9, 10, 11, 31, 32, 38, 39, 40, 41, 42, 43, 48, 49, 52, 53, 54, 55, 58 |

Items #22 and #51 are explicitly dropped per user instruction.

---

## Implementation status (live)

### Wave 1 — merged via PR #17 (2026-05-05)
- Lock gate removed entirely (`LockGate.tsx`, `Protected*` wrappers, access-request form + endpoint deleted).
- CSP `_headers` corrected (Cloudflare Pages).
- Crystal-chip palette bumped to `bg-*-700` for WCAG AA contrast.

### Wave 2 — PR #18 OPEN (`feature/wave2-residual-ux`)
- Gallery SSG: build-time fetch via `db-server.ts` (sql.js in Node mode); 159 mineral cards rendered as static HTML; sql.js wasm only loads on first dynamic search/filter action. Net win: 6 MB HTML / 415 KB gzipped vs 8.25 MB DB + wasm.
- Article `dateModified` schema + visible "Last updated" line. Fallback chain: `reviewedAt` → file mtime (preserved via `git log -1 --format=%cI` stamp in `sync-knowledge.ts`) → now.
- Playground preview Retry button on render error.
- Hero badge mobile clipping fixed (responsive padding + ellipsis truncation).
- 404 polish: crystal-lattice SVG, "Lost in the lattice" h1, h-hierarchy fix, third CTA.
- DOMPurify SSR short-circuit (`sanitize-svg.ts`) — required because gallery now SSRs through trusted `crystal-renderer` SVGs.

### Wave 3 — merged via PR #19 (2026-05-05)
- W7 Copy: hero headline + subhead, feature-grid copy, Quiz/Gallery/Tools/404 subheads, footer FGA underline, BrE sweep ("practising"/"colour").
- W8 E-E-A-T: visible "Last updated" line + author byline ("gemmology.dev editors"), file-mtime fallback for `dateModified`, LearningResource + Article JSON-LD with `headline` / `author` / `publisher` / `dateModified` / `datePublished` / `about`.
- W9 a11y/visual: mineral detail column flip (CrystalStructureCard above QuickFacts on every viewport), shared acronym-aware `formatLabel` (CVD/HPHT/FTIR/…) used by mineral detail / FamilyModal / CounterpartsSection, parenthetical stripped from synthetics list, gallery search input given accessible label/id/name, "Difficulty (optional)" spacing fix, decorative arrows `aria-hidden="true"` across tools/references/counterparts, 404 "Return to homepage" CTA replacing dead Playground link.

#### Deferred from Wave 3 (P2 nice-to-have, content-dependent)
- Article intros restructured to lead with the citable answer — requires editing YAML in `gemmology-knowledge` (different repo).
- References footer rendering for `[ref:slug]` markers — dormant; current learn YAML has no markers, so the system would be dead code until content is updated.
- Sticky progress bar + collapsible TOC for >6 H2 articles.
- Asterism / crystal-systems point-group bridge content extension.
- Learn typography weight-ratio ≥1.4× — current ratio acceptable; revisit if hierarchy issues resurface.
- Dark hero-band chip contrast — could not locate a matching component on live site; treated as obsolete after lock-gate removal.

Excludes #22 author byline (kept dynamic) and #51 `LLM-Content:` directive per user instruction.

### Stale local branches (already represented on `main` via squash-merged PRs — not re-merged)
`feat/study-*` (PR #14), `feature/study-v1-contracts` (PR #14), `fix/contrast-palette` / `fix/learn-heading-hierarchy` / `fix/mineral-count-source-of-truth` / `fix/admin-sitemap-exclude` (rolled into PR #11), `chore/mineral-data-2.3.0` (PR #13), `chore/llms-txt-discovery` (PR #12), `chore/bump-mineral-data-2.2.1` (PR #10), `chore/v2.2-content-counts` (PR #9), `feature/calculator-layout` (PR #2), `feature/family-expressions-ui` (PR #5), `feature/ux-improvements` (PR #1), `feature/ux-fix-batch` (PR #11), `fix/a11y-hints` (PR #15), `fix/quick-check-palette` (PR #16), `feature/remove-lock-gate` (PR #17).

# SEO v3 Validation Report

**Branch:** `main`
**Built:** 2026-05-13
**Validator:** automated `npm run validate:citations` + `npm run build` + targeted dist/* assertions
**Plan:** `~/.claude/plans/piped-frolicking-matsumoto.md` (SEO v2.5 + v3 Bootstrap)

## Wave A — implementation status

| Workstream | Description | PRs | Status |
|------------|-------------|-----|--------|
| WA1 + WA2 | Learn intro expansion (134 articles to 130–165 words) + unused-ref cleanup | gemmology-knowledge#19–26 (8 sub-agent PRs) + #27 (residual cleanup) | merged |
| WA3 Hub 3 | `/learn/` repositioned as FGA exam preparation hub | gemmology.dev#36 | merged |
| WA3 Hubs 1, 2, 4, 5 | Identification, properties, equipment, treatments hubs | — | deferred (Wave A follow-up) |
| WA4 | Docs subdomain cross-linking (nav + hero + footer across 6 repos) | 6 PRs across sibling repos | merged |
| WA5 | knowledge.gemmology.dev module-page reciprocity | gemmology-knowledge#17 | merged |
| Schema widening | Accept string-valued issue/volume in citation refs | gemmology.dev#37 | merged |
| Knowledge version pin | Bump KNOWLEDGE_VERSION → v1.3.0 | gemmology.dev#38 | merged |

## Build assertions (post-Wave A)

| Assertion | Expected | Observed | Status |
|-----------|----------|----------|--------|
| `npm run sync` files | ≥138 | 138 | PASS |
| `validate:citations` errors | 0 | 0 | PASS |
| `validate:citations` warnings | 0 | 0 | PASS (was 39 pre-WA2; transient 7 cleaned in #27) |
| `npm run build` pages | ≥900 | 913 | PASS |
| Sitemap `<url>` count | ≈466 | 467 | PASS |
| `/learn/` body words | rich | 3616 | PASS (added FGA-positioning lead) |
| `/learn/` JSON-LD blocks | ≥2 (Course + Breadcrumb) | 3 (Course, CollectionPage, BreadcrumbList) | PASS |
| `/about/` body words | ≥350 | 384 | PASS |
| `/quiz/` body words | ≥250 | 541 | PASS |
| `/tools/` body words | ≥200 | 521 | PASS |

## Learn intro expansion (WA1) — sample check

Random sample of 10 first-section content blocks across categories. Each follows the AI-citation three-beat pattern (definition / diagnostic significance / concrete example with a named species and a number).

Word counts (target 130–165): all 134 expanded files fall in band. The 4 pre-existing long-form intros (`fundamentals/optic-sign-determination`, `fundamentals/twin-laws`, `fundamentals/colour-theory`, `identification/treatments-deep/beryllium-diffusion`) remain unchanged and exceed 165 by design.

## Citation cleanup (WA2)

Pre-WA2: 39 unused-reference warnings.
Post-WA2 (PRs #19–26 in gemmology-knowledge): 7 residual warnings.
Post-#27 cleanup: **0 warnings**.

Removed orphans:
- `dubey-2023-libs` (colour-theory)
- `schumann-2013-gemstones` (optic-sign-determination, twin-laws — duplicate)
- `kane-1990-diffusion` (solid-inclusions)
- `kammerling-1991-emerald` (lab-reports)
- `lmhc-standards` (professional-practice — already cited via cibjo/ftc/iso-18323)
- `read-2014-gemmology` (madagascar/ruby)

## Hubs 1, 2, 4, 5 — keyword-cluster hubs (WA3, `gemmology.dev#39`)

Shipped 2026-05-13. Each hub renders ≥400 server-side body words, emits at least one JSON-LD block declaring the hub as a study unit (`LearningResource` / `Dataset`), and links to ≥4 existing child pages.

| Hub | Route | Head term | Body words | JSON-LD blocks | Child `/learn/` links |
|-----|-------|-----------|-----------:|---------------:|----------------------:|
| 1 — Identification cluster | `/learn/identification/` | "how to identify gemstones" | 922 | 2 (LearningResource + BreadcrumbList) | 15 |
| 4 — Instruments guide | `/learn/equipment/` | "how to use a refractometer gemstone" | 931 | 2 (LearningResource + BreadcrumbList) | 14 |
| 5 — Treatments & synthetics | `/learn/identification/treatments/` | "synthetic diamond identification" | 876 | 2 (LearningResource + BreadcrumbList) | 8 |
| 2 — Properties reference | `/reference/properties/` (NEW route) | "gemstone properties chart" | 1209 | 3 (Dataset + WebPage:Table + BreadcrumbList) | 6 |

Key structural decisions:
- The treatments YAML article (`identification/treatments`) collides with the new static hub at the same URL; the dynamic `[...slug]` catch-all is updated to filter that slug from `getStaticPaths`, so the YAML content stays in the collection (referenced by the hub) without a duplicate-route build error.
- Hub 2 ships an inline 50-gem reference table rather than a DB-driven render so the table-rich-result HTML stays static and deterministic; sources cited inline (Webster, Read, O'Donoghue, Schumann, LMHC).
- Hub 2's `WebPage` declares `mainEntity: Table` — the table-rich-result eligibility lever flagged in `keywords.md`.

## Hub 3 — FGA exam preparation positioning (WA3)

`/learn/` now declares (`gemmology.dev#36`):
- `<title>`: "Learn Gemmology — Free FGA Exam Preparation & Study Guide"
- 145-word lead paragraph naming Gem-A Foundation and Diploma exams and the supporting article cluster
- Extended `Course` JSON-LD:
  - `alternateName` array including "FGA Exam Preparation" and "Gem-A Diploma Study Guide"
  - `educationalCredentialAwarded` → full `EducationalOccupationalCredential` with `recognizedBy: Gem-A`
  - `audience: EducationalAudience` with `educationalRole: student`
  - `isAccessibleForFree: true`

## Docs subdomain cross-linking (WA4)

All 6 sibling MkDocs repos shipped: `cdl-parser`, `cdl-lsp`, `crystal-geometry`, `crystal-renderer`, `mineral-database`, `gemmology-knowledge`.

Each `mkdocs.yml` now declares:
- An external "Try interactive ↗" nav tab pointing to the relevant gemmology.dev surface
- A 5-icon footer (GitHub, Playground, Quiz, Gallery, Learn) each with `name:` aria-label

Each `docs/index.md` replaces the bare credit line with a `!!! tip "Interactive companion"` admonition containing three external links to gemmology.dev.

Backlink corpus added: ~250 internal anchor-text references across the 6 docs subdomains pointing at `/playground/`, `/gallery/`, `/minerals/`, `/learn/`, `/quiz/`.

## Reciprocity from knowledge.gemmology.dev (WA5)

All 6 module markdown pages in `gemmology-knowledge/docs/learn/` now carry an `!!! tip "Interactive version"` admonition near the top linking to the canonical category-nested URL on gemmology.dev:

| Module | Reciprocal URL |
|--------|----------------|
| `crystal-systems.md` | `/learn/fundamentals/crystal-systems/` |
| `physical-properties.md` | `/learn/fundamentals/physical-properties/` |
| `optical-properties.md` | `/learn/fundamentals/optical-properties/` |
| `inclusions.md` | `/learn/identification/inclusions/` |
| `treatments.md` | `/learn/identification/treatments/` |
| `synthetics.md` | `/learn/identification/synthetics/` |

## Outcome

Wave B verification **PASSES**. Citation pipeline, schema validation, and all five keyword-cluster hubs are production-ready. Remaining work tracked separately:

- **WO1** — DataForSEO MCP server install + live-data keyword re-run, to confirm priority ordering against measured KD/volume
- **WB-GSC** — Resubmit sitemap in Google Search Console + Bing Webmaster, URL-inspect the five hubs + cross-linked subdomain indices
- **External validation** — manual Rich Results Test pass on each of the five hubs (Hub 3 plus the four shipped in `#39`)

## External validation (manual, post-deploy)

After production deploy, run each updated/new URL through Google's Rich Results Test
(https://search.google.com/test/rich-results) and Schema.org's structured-data linter
(https://validator.schema.org/) and append the screenshots / pass-fail markers here.

Templates to test:

- `https://gemmology.dev/learn/` (FGA Course schema with new `educationalCredentialAwarded`)
- `https://gemmology.dev/learn/fundamentals/crystal-systems/` (expanded intro + LearningResource)
- Sample expanded-intro articles from each category (e.g. `species/diamond`, `phenomena/chatoyancy`, `equipment/refractometer`)

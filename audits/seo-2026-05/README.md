# SEO Investigation 2026-05 — gemmology.dev vs knowledge.gemmology.dev

**Question:** Why is gemmology.dev indexed worse than knowledge.gemmology.dev despite being the better site? And how do we optimise SEO for gemmology-study and gemstone-research search intent?

**Method:** Parallel agent dispatch — six specialist SEO agents (technical, content, GEO, schema, keyword research, sitemap) audited the site against the docs subdomain and against prior audit `audits/T7c-seo.md`.

## Files in this directory

| File | Owner | Findings |
|------|-------|----------|
| `technical.md` | seo-technical | Crawl/render/index gap analysis |
| `content.md` | seo-content | Thin-page risk on /tools, /quiz, /playground; E-E-A-T gaps |
| `geo.md` | seo-geo | llms.txt structure + AI citability; knowledge.subdomain has NO robots.txt |
| `schema.md` | seo-schema | Missing Course/Quiz/SoftwareApplication JSON-LD |
| `keywords.md` | seo-dataforseo | 35 seed terms — heuristic (no DataForSEO MCP) |
| `sitemap.md` | seo-sitemap | 442 of 910 sitemap URLs are OG image templates |

## Root cause of the indexing gap (convergent finding)

Three converging issues — not a content quality problem:

1. **Sitemap pollution.** 442 of 910 sitemap URLs are `/og/...` image-template pages (1200×630 social cards). Google sees a sitemap where 48% of entries are thin near-duplicate pages, halving effective crawl budget. knowledge.gemmology.dev has no such junk.
2. **Empty shells for the high-value surfaces.** `/tools/`, `/quiz/`, `/playground/`, `/tools/optical`, `/tools/lab`, etc. ship as `client:load` React islands. First-byte HTML for these pages is `<h1>+<p>` at best, often nothing on the hub. knowledge.gemmology.dev serves Markdown→HTML with 300–800 words of indexable prose per page.
3. **Knowledge-subdomain advantage is purely structural.** Same authors, same domain authority, but the docs subdomain ships content as plain HTML and gemmology.dev ships it as JavaScript. Content quality is not the gap. Crawlability is.

Secondary: knowledge.gemmology.dev itself has **no robots.txt and no llms.txt** — it indexes well in classical search but is invisible to AI crawlers. The fastest GEO win is adding those two files to the docs subdomain.

## Prioritised fix list

### P0 — Indexing gap closers (1–2 days of work)

1. **`astro.config.mjs` sitemap filter.** Exclude `/og/`, `/og-image/`, `/study/review`, `/study/settings`. Exact diff in `sitemap.md`. Effect: sitemap drops from 910 → ~466 clean URLs.
2. **Add `noindex` to OG templates.** `src/pages/og/learn/[...slug].astro` and `src/pages/og/minerals/[slug].astro` need `<meta name="robots" content="noindex, nofollow">`.
3. **Add SSG intro prose to tool pages.** 5 example paragraphs in `content.md`. Each tool category page (`measurement.astro`, `optical.astro`, `lab.astro`, `identification.astro`, `advanced.astro`, `conversions.astro`) gets 300–500 server-rendered words before the React island. Also add SSG intro + `<h1>` to `/tools/` hub (currently fully client-rendered).
4. **Fix LearnSchema BreadcrumbList fragment URL.** `LearnSchema.astro` line 73 emits `learn#fundamentals` as a BreadcrumbList item — invalid. Change to canonical `/learn`. (Carried over from prior audit, still open.)

### P1 — Schema and structure (2–3 days)

5. **`Course` + `EducationalOccupationalCredential` schema on `/learn/index`.** Tells Google the 139 articles form an FGA-prep curriculum. Highest single AI-visibility lever per the schema audit.
6. **`Quiz` + `hasPart` on learn articles (F-04 unblock).** Now that `LearnQuizWidget` is wired, `LearnSchema.astro` can declare per-article quizzes. Boilerplate JSON-LD in `schema.md`.
7. **`SoftwareApplication` JSON-LD on `/tools/*`.** Single shared `ToolsSchema.astro` covers all 6 category pages.
8. **Tools hub h1 + intro.** Server-render an h1 and 200-word intro on `/tools/index.astro` (currently 100% client-rendered).
9. **`/quiz/` `Course` schema** with the 8 categories declared as `hasCourseInstance`.

### P2 — GEO / AI-search readiness (3–5 days)

10. **Restructure `llms.txt`** — currently omits all `/tools/` pages and lists mineral URLs as bare slugs without descriptions. Add `## Tools` section with one line per category. Convert mineral bare URLs to titled entries. Source: `src/pages/llms.txt.ts`.
11. **Named AI-crawler stanzas in robots.txt.** Perplexity's crawler docs require explicit `Allow` per `User-agent: PerplexityBot`. Add stanzas for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended.
12. **knowledge.gemmology.dev gets robots.txt + llms.txt.** Two files, two hours. Unlocks AI-crawler access to the better-structured docs content.
13. **Expand `/learn/[slug]` Introduction blocks to 130–165 words** in YAML source — the citation-optimum length for AI engines. Per-passage examples in `geo.md`.
14. **Add named author + credentials** to `/about` and to `LearnSchema` Person node. Currently every page bylines an Organisation, not a credentialed individual — weak E-E-A-T signal.

### P3 — Keyword & content programme (ongoing)

15. **Build a static crawlable mineral-properties reference table** (the mineral DB is currently sql.js, JS-only, invisible to crawlers).
16. **Consolidate fragmented identification pages into one `/identify` hub.** High-volume terms like "gemstone identification chart" map to nothing today.
17. **Add explicit FGA/Gem-A positioning statement** to `/learn` hub and About — clarifies which exam syllabus the curriculum maps to.
18. **Question-format H2s** in learn articles ("What is birefringence?") — AI Overviews match heading text against natural-language query form.

## Quick wins (today, under 1 hour total)

- One-line filter change in `astro.config.mjs` (removes 442 junk URLs from sitemap).
- Add `<meta name="robots" content="noindex">` to two OG template files.
- Add `<h1>` and a 50-word intro paragraph to `/tools/index.astro`.

These three changes alone should noticeably lift gemmology.dev's classical-search visibility within 1–2 crawl cycles, because the sitemap signal-to-noise ratio doubles overnight.

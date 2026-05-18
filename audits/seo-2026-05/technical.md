# Technical SEO Audit — gemmology.dev vs knowledge.gemmology.dev

**Date:** 2026-05-11
**Scope:** Static Astro site (gemmology.dev) vs docs subdomain (knowledge.gemmology.dev)

---

## TL;DR

- 441 OG image template pages (1200x630 card renders) are included in the sitemap with no noindex, diluting crawl budget and forcing Googlebot to discover thin, imageless HTML shells alongside real content pages.
- Every high-value tool page (`/tools/`, `/tools/measurement`, etc.) and the quiz hub (`/quiz/`) ship zero server-rendered body text — only `<BaseLayout>` wrapper HTML plus a `client:load` React island — giving Googlebot nothing to index before JavaScript executes.
- knowledge.gemmology.dev serves pre-rendered Markdown as plain HTML; every heading, paragraph, and code block is immediately visible to crawlers, explaining its superior indexing rate.

---

## Root cause of indexing gap

gemmology.dev relies on `client:load` React hydration for its highest-traffic surfaces (tools, quiz, playground). At crawl time, Googlebot receives a shell page containing only `<title>`, `<meta description>`, and an empty `<div>` mount point. Even when Googlebot's secondary rendering queue eventually processes JavaScript, the rendering budget is already stressed by 441 spurious `/og/` URLs in the sitemap. knowledge.gemmology.dev has no such issues: its content is static Markdown rendered at build time with full heading hierarchy and body text visible in the initial HTML response.

---

## P0 Issues

**P0-A: 441 `/og/` pages in sitemap with no noindex**
- File: `astro.config.mjs` line 25 — sitemap filter is `!page.includes('/admin')` only
- File: `src/pages/og/minerals/[slug].astro`, `src/pages/og/learn/[...slug].astro`
- These pages are 1200x630 HTML card templates. They contain no article body, no prose, no structured data. They bloat the sitemap from ~450 meaningful URLs to ~900, halving effective crawl budget allocation.
- Neither OG template file contains a `noindex` meta tag or `X-Robots-Tag`.
- Fix: add `!page.includes('/og/')` to the sitemap filter in `astro.config.mjs` AND add `<meta name="robots" content="noindex, nofollow" />` inside both OG template files.

**P0-B: Tools and Quiz pages render zero crawlable body text**
- `src/pages/tools/index.astro` line 13: `<ToolsHub client:load />`
- `src/pages/tools/measurement.astro` line 22: `<MeasurementTools client:load />` (h1 and intro paragraph ARE server-rendered here — partial pass)
- `src/pages/quiz/index.astro` line 28: `<QuizPage client:load learnEntries={entries} />` — all question UI is client-side only
- `src/pages/playground.astro` line 13: `<Playground client:load />` — zero server-rendered body
- `/tools/index.astro` has no h1, no intro copy, and no server-rendered content at all. A Googlebot crawl returns only the `<BaseLayout>` shell.
- Most category tool pages (`advanced.astro`, `optical.astro`, `lab.astro`, `identification.astro`, `conversions.astro`) likely follow the same pattern as `measurement.astro` (h1 + intro paragraph SSG, widget CSR) — measurement.astro passes, but the hub does not.

**P0-C: F-01/F-02 fix validation — CONFIRMED FIXED**
- No `LockGate` component referenced in any page. `/quiz/index.astro` no longer has a "Coming Soon" gate. Both prior findings are resolved.

---

## P1 Issues

**P1-A: Sitemap filter does not exclude `/og/` (also a P0)**
Already covered above. Secondary effect: the sitemap priority system in `astro.config.mjs` assigns `/og/` pages the default 0.7 priority because no pattern matches them, making them appear equal in importance to `/learn/` articles.

**P1-B: `/quiz/` has no structured data**
F-04 from prior audit is unresolved. `src/pages/quiz/index.astro` has title and description but no `Course` or `Quiz` JSON-LD schema. `/learn/[...slug].astro` was confirmed in prior audit to render YAML server-side with schema; quiz hub does not.

**P1-C: `llms.txt` is an API route, not a static file**
`src/pages/llms.txt.ts` returns `text/plain` correctly (confirmed: `Content-Type: text/plain; charset=utf-8`). However, as an SSR endpoint on a static output site, it requires the Astro serverless adapter. If deployed to a CDN without a runtime (e.g. pure S3/GitHub Pages), this returns 404 silently. Robots.txt references it. Verify it resolves in production.

---

## P2 Issues

**P2-A: `/tools/` hub has no h1 and no SSG copy**
`src/pages/tools/index.astro` delegates everything to `<ToolsHub client:load />`. Even the page heading is rendered by React. The `<title>` is "Tools" with a thin description. Add an h1 and one-paragraph intro to the Astro frontmatter to give Googlebot something to index without JS.

**P2-B: Sitemap includes `/study/review` and `/study/settings`**
Both carry `noindex={true}` in their BaseLayout call, meaning they will be indexed-excluded at render time but are still submitted in the sitemap. The sitemap filter should exclude `/study/` utility routes.

---

## Fix checklist

- [ ] `astro.config.mjs` sitemap filter: add `&& !page.includes('/og/')` and `&& !page.includes('/study/')`.
- [ ] `src/pages/og/minerals/[slug].astro` and `src/pages/og/learn/[...slug].astro`: add `<meta name="robots" content="noindex, nofollow" />` in the `<head>`.
- [ ] `src/pages/tools/index.astro`: add server-rendered `<h1>` and intro paragraph before `<ToolsHub client:load />`.
- [ ] `src/pages/quiz/index.astro`: add `Quiz` or `Course` JSON-LD schema block in BaseLayout head slot.
- [ ] Verify `llms.txt` resolves to `text/plain` in production (not 404); if static adapter, convert to a static `.txt` file generated at build time.
- [ ] Confirm `/study/review` and `/study/settings` are excluded from sitemap output after filter change.

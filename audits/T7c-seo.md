# T7c — SEO/Crawlability Audit (study-system v1)

**Branch**: `feature/study-v1`  
**Auditor**: T7c SEO specialist (static analysis, read-only)  
**Date**: 2026-05-05  
**Methodology**: Static inspection of HTML source, Astro config, robots.txt, content collection schema, auth component tree, and release documentation. No live HTTP fetches or build execution. The orchestrator stopgap (`T7c-seo-orchestrator-stopgap.md`) was read first and is superseded by this document, which adds specialist depth on structured data viability, Googlebot WRS rendering edge cases, soft-404 risk under the LockGate auth pattern, and crawl-budget implications of the questions content collection.

---

## Findings

### F-01 — `/quiz` is indexed with a "Coming Soon" gate text that Google will read as thin content

- **Severity**: P1
- **Category**: Indexability / Rendering
- **Evidence**: `src/pages/quiz/index.astro:27-32` — `<BaseLayout title="Quiz" description="...">` with `noindex` absent (defaults `false`). `src/components/auth/LockGate.tsx:79-100` — the unauthenticated render path outputs `<CardTitle>Coming Soon</CardTitle>` plus a two-tab invite-code form. This is the only HTML Googlebot sees before JavaScript hydration.
- **Why it matters**: Googlebot's Web Rendering Service (WRS) executes JavaScript, but it does so in a second wave that may lag hours behind the initial crawl. During that first-wave crawl the raw static HTML emitted by Astro for `quiz/index.astro` contains the `<BaseLayout>` shell plus an empty `<div id="root">` island mount point — no textual content at all. When WRS eventually renders the React island, it resolves `useAuth` → `isLoading: true` (a `useEffect` sets state after mount), so Googlebot sees the "Loading..." spinner for the duration of its rendering budget. Even if WRS waits long enough to see the gate form, what it indexes is "Coming Soon / This feature is still under development" — which Google's quality algorithms treat as a soft-404 candidate or a low-quality page. A page returning HTTP 200 with "Coming Soon" body text is a documented Google Search Console soft-404 pattern (Google Search documentation, "Avoid soft 404 errors"). There is no `noindex` to prevent this from appearing in SERPs as a stub entry.
- **Fix**: Pass `noindex={true}` from `src/pages/quiz/index.astro` until the quiz is publicly launched. When it goes public, either (a) pre-render a substantive static description of the quiz above the React island so Googlebot's first-wave crawl has real content, or (b) keep `noindex` until the gate is removed entirely. Option (b) is lower-risk for v1.0.

---

### F-02 — LockGate `isLoading` state creates a two-phase rendering trap for Googlebot WRS

- **Severity**: P1
- **Category**: Rendering
- **Evidence**: `src/components/auth/useAuth.ts:97-110` — `isLoading` initialises to `true`; `setIsLoading(false)` is called inside `useEffect` after `localStorage` read. `src/components/auth/LockGate.tsx:34-38` — when `isLoading` is `true` the component renders only `<div class="animate-pulse text-slate-400">Loading...</div>`. `src/pages/quiz/index.astro:31` — `<ProtectedQuiz client:load learnEntries={entries} />` uses `client:load`, which hydrates immediately after the page's first paint.
- **Why it matters**: Googlebot WRS does not have access to `localStorage` (it runs in a sandboxed environment with no persistent storage). `getStoredSession()` in `useAuth.ts:57-63` guards with `if (typeof window === 'undefined') return null;` — this correctly prevents SSR errors, but at WRS runtime `window` exists yet `localStorage` is empty. The `useEffect` fires, reads `null`, and calls `setIsLoading(false)` then `setIsAuthenticated(false)`. This transition is synchronous from JavaScript's perspective but WRS may snapshot the DOM at any point after the initial render. Depending on WRS render budget allocation for this URL, Google may index the "Loading..." state, the gate form, or (if budget is generous) the gate form with tabs. None of these states produce indexable content. More critically: `client:load` means the island hydrates as part of the main thread work immediately after the Astro shell loads — there is no deferral that would allow WRS to find pre-rendered content first. Contrast this with `client:visible` or `client:idle`, which would at least not block the LCP paint on the island.
- **Fix**: For the authenticated quiz content, `client:load` is correct once the gate is removed. Until then, the rendering directive is irrelevant because the gate makes the page noindex-worthy (see F-01). Document this rendering pattern in `docs/study-system.md` so future developers understand why the quiz page must carry `noindex` while gated.

---

### F-03 — `LearnQuizWidget` is not wired into `/learn/[...slug].astro` — promised pretest is missing from all learn pages

- **Severity**: P1
- **Category**: Indexability / Structured Data
- **Evidence**: `src/pages/learn/[...slug].astro:1-197` — the file imports `LearnSchema`, `SectionRenderer`, `Breadcrumb`, `PageNav`, `Container`, `Card`, `Badge`. It does NOT import `LearnQuizWidget` and does not render it. `src/components/quiz/study/LearnQuizWidget.tsx` exists and is fully implemented. `docs/study-system.md:177` states "LearnQuizWidget — Three-question pretest widget embedded above each `/learn/[slug]` article". `docs/release-checklist-study-v1.md:33` has a gated acceptance criterion: "[ ] `/learn/<slug>` pages render a 3-question pretest widget above content."
- **Why it matters**: The SEO consequence is twofold. First, an unchecked release-checklist item ships, meaning the documented feature is absent and any documentation or announcement that describes the pretest widget will link to pages that do not show it — a trust and credibility signal for the site. Second, and more significant from a structured data perspective: `LearnQuizWidget` represents a genuine opportunity to inject `Quiz` schema.org markup on learn pages. The `Quiz` type (schema.org/Quiz, a subtype of `CreativeWork`) allows Google to understand that a page contains assessment content, and when combined with the existing `LearningResource` markup in `LearnSchema.astro`, would create a richer educational entity signal. Without the widget being present on the page, there is no factual basis for adding `Quiz` schema — and a structured-data declaration that describes content not visible in the HTML is a Google policy violation (misrepresentation). The widget must be wired up before any quiz-related schema can be added to learn pages.
- **Fix**: Add `import { LearnQuizWidget } from '../../components/quiz/study/LearnQuizWidget'` to `src/pages/learn/[...slug].astro`, fetch up to 3 questions filtered to the article's `sourceArticle` slug from the curated bank, and render `<LearnQuizWidget client:visible ... />` above the `<article>` body. Use `client:visible` (not `client:load`) so the widget hydrates only when scrolled into view, avoiding unnecessary JS execution on pages where the reader scrolls past immediately — this also improves INP on the learn pages.

---

### F-04 — `LearnSchema.astro` omits `Quiz` schema for the pretest widget and misses `Course` / `EducationalOccupationalCredential` opportunities

- **Severity**: P2
- **Category**: Structured Data
- **Evidence**: `src/components/seo/LearnSchema.astro:28-61` — emits `["LearningResource", "Article"]` with `educationalLevel`, `teaches`, and `about`. No `Quiz` type, no `hasPart` reference to quiz questions, no `Course` entity linking the series of learn articles.
- **Why it matters**: Three structured-data enhancements are available but not exploited:
  1. **`Quiz` type**: Once `LearnQuizWidget` is wired (F-03 fixed), each learn page that renders a pretest legitimately contains quiz content. `Quiz` is a schema.org type (subtype of `CreativeWork`) supported by Google. Adding it as a `hasPart` on the `LearningResource` or as a sibling JSON-LD block signals to Google that the page contains interactive assessment, which is eligible for the "Practice problems" rich result in Google's experimental education SERP features.
  2. **`Course` entity**: The ordered sequence of learn articles (sorted by `order` field, grouped by `category`) is architecturally a course. A single `Course` JSON-LD block on `/learn/index.astro` with `hasCourseInstance` pointing to `CourseInstance` entities for each category, and `syllabusSections` enumerating the articles by slug, would allow Google to understand the content as an educational programme rather than a loose collection of articles. This is particularly valuable for FGA-aligned content where the structured curriculum is a differentiator.
  3. **`EducationalOccupationalCredential`**: The quiz system targets FGA-foundation, FGA-diploma, and GIA-GG exam preparation (field `examRelevance` in `src/content/config.ts:118-120`). A `EducationalOccupationalCredential` entity describing the FGA diploma, referenced from the `Course` schema as `educationalCredentialAwarded`, tells Google the educational goal of the content and surfaces it in credential-related searches.
- **Fix** (phased):
  - Phase 1 (v1.0, low effort): Add `"hasPart": { "@type": "Quiz", "name": "Pretest", "url": url }` to the existing `articleSchema` in `LearnSchema.astro` once F-03 is resolved.
  - Phase 2 (v1.1): Add a `Course` JSON-LD block to `src/pages/learn/index.astro` covering all categories and articles.
  - Phase 3 (v1.1): Add `EducationalOccupationalCredential` referencing FGA diploma to the `Course` entity. Note: this should NOT claim the site itself awards the credential — only that the content prepares for it (`prepares` property).

---

### F-05 — `FAQPage` schema for `RationalePanel` distractor rationales is not eligible and must not be added

- **Severity**: P2 (risk of future mistake)
- **Category**: Structured Data
- **Evidence**: `src/components/quiz/study/RationalePanel.tsx` — renders per-distractor rationale text post-submit. `src/components/auth/LockGate.tsx` — all quiz content is behind an auth gate. Google's Rich Results guidelines for `FAQPage` schema state the structured data must match the visible page content, and the content must be publicly accessible (no login required). Additionally, `FAQPage` is only eligible when questions and answers are both present in HTML that crawlers can read.
- **Why it matters**: A developer might attempt to add `FAQPage` schema treating question stems as FAQ questions and rationales as answers — this is a tempting shortcut to gain the `FAQ` rich result accordion. It is ineligible on three grounds: (1) the rationale content is behind the LockGate auth wall, so it is not publicly visible; (2) even if the gate were removed, the rationale renders only post-submission — it is not present in the initial HTML that crawlers index (it is toggled in React state after `isSubmitted` becomes `true`); (3) quiz question/answer pairs are not FAQ content semantically — `FAQPage` is for editorial Q&A, not assessment items. Adding `FAQPage` schema for gated or dynamically revealed content would violate Google's structured data policies and risks a manual action for "Structured data policy violation."
- **Fix**: Do not add `FAQPage` schema to any quiz or learn page. The correct schema for quiz content is `Quiz` (see F-04). For the rationale content specifically, it has no eligible schema type in its current gated/dynamic form.

---

### F-06 — `/study/review` and `/study/settings` are documented and release-checked but routes do not exist

- **Severity**: P1
- **Category**: Crawlability / Indexability
- **Evidence**: `find /src/pages/study` returns no results — the directory does not exist. `docs/study-system.md:195-199` documents both routes. `docs/release-checklist-study-v1.md:32` has acceptance criterion "[ ] `/study/review` shortcut shows due items only". `docs/release-checklist-study-v1.md:111-112` expects the IndexNow workflow to submit `/study/*` URLs post-deploy.
- **Why it matters**: The IndexNow post-deploy workflow will diff the sitemap and attempt to submit `/study/review` and `/study/settings`. If those URLs are not in the sitemap (because the pages do not exist), the IndexNow batch is simply smaller — no direct crawl harm. However, if the release announcement or any internal link references these URLs, they will 404, which Googlebot logs and, over repeated crawls, uses as a signal that the site has broken internal links. More critically, the release checklist has a blocking acceptance criterion (`/study/review` shortcut) that is currently unmet, meaning the checklist cannot be signed off and the PR should not be merged with the study routes undeclared.
- **Fix**: Either (a) create `src/pages/study/review.astro` and `src/pages/study/settings.astro` as minimal wrappers before the release PR, or (b) remove these routes from `docs/study-system.md`, `CLAUDE.md`, and the release checklist. If option (b), also remove the corresponding IndexNow spot-check step. The route stubs should use `BaseLayout` with appropriate `noindex` prop depending on whether they are gated.

---

### F-07 — Sitemap `serialize` callback has no rule for `/quiz` or `/study/*` — both get the default `priority: 0.7`

- **Severity**: P2
- **Category**: Sitemap / Crawl Budget
- **Evidence**: `astro.config.mjs:29-47` — `serialize(item)` has explicit priority boosts for `/`, `/gallery/`, `/learn/`, `/minerals/`, and `/docs/`. No case for `/quiz` or `/study/*`. The default fallback is `priority: 0.7` and `changefreq: 'weekly'`.
- **Why it matters**: `priority: 0.7` overvalues a gated "Coming Soon" page relative to the content hub pages at the same priority. While Googlebot officially treats sitemap `priority` as a hint rather than a directive, the signal still influences crawl scheduling in aggregate across a large sitemap. Including `/quiz` in the sitemap at 0.7 while it returns a "Coming Soon" gate creates a crawl-budget allocation to a page with no indexable content. The more significant issue is `changefreq: 'weekly'` — this instructs Googlebot to revisit the quiz page every week; each revisit will see the same gate and progressively builds a "always the same thin content" quality signal. The `lastmod: new Date()` evaluated at build-time (flagged by the orchestrator stopgap) compounds this, because `/quiz` will appear to have changed at every deploy even when only unrelated pages changed.
- **Fix**: In the `serialize` callback, add a case for `/quiz/` that sets `priority: 0.3` and `changefreq: 'monthly'` while it is gated. When the gate is removed (or `noindex` is added per F-01), consider removing `/quiz` from the sitemap entirely until there is publicly indexable content to justify inclusion. For `/study/*` routes when created, set `priority: 0.6` and `changefreq: 'weekly'`.

---

### F-08 — Question YAML files (50 items, `type: 'data'`) are correctly non-routed but their build-graph inclusion has one crawl-budget edge case

- **Severity**: P3 (info with one actionable item)
- **Category**: Crawl Budget
- **Evidence**: `src/content/config.ts:83-152` — `defineCollection({ type: 'data', ... })`. Astro `data` collections are loaded at build time via `getCollection()` and produce zero URL routes. The 50 YAML files in `src/content/questions/` are never emitted as crawlable HTML. `src/pages/quiz/index.astro:6-24` — `getCollection('learn')` is called (not `getCollection('questions')`), because question loading is delegated to `generateQuestions()` inside the React island at runtime.
- **Why it matters**: The crawl-budget impact is zero — correct. However, there is one indirect risk: `src/pages/quiz/index.astro` passes the entire `learnEntries` array (all 91 YAML learn entries serialised) into the island as a prop: `<ProtectedQuiz client:load learnEntries={entries} />`. At build time, Astro inlines this prop as a JSON string in the emitted HTML. The 91 learn entries, each with full `sections` arrays, could produce a large inline JSON blob that inflates the HTML payload of `quiz/index.html`. A large HTML payload directly increases Time to First Byte and LCP for the page, and large inline scripts are flagged by Lighthouse's "Avoid large payloads" audit. This is distinct from the question YAML crawl-budget question, but worth measuring before ship.
- **Fix**: Measure the serialised size of `entries` in the built `quiz/index.html`. If it exceeds ~50 KB, refactor to pass only the minimal fields needed for question generation (e.g., `id`, `category`, `sections` titles) rather than the full entry objects. The `data.sections` field containing full article content is unlikely to be needed by `generateQuestions()` for most generation strategies — confirm by reviewing `src/lib/quiz/question-generator.ts`.

---

### F-09 — `LearnSchema.astro` BreadcrumbList has a broken `item` URL at position 3 (category anchor)

- **Severity**: P2
- **Category**: Structured Data
- **Evidence**: `src/components/seo/LearnSchema.astro:67` — `"item": \`https://gemmology.dev/learn#${category}\`` — a fragment URL. Google's BreadcrumbList documentation states that `item` should be a "URL of the page" and while fragment URLs are technically valid, Google's Rich Results Test and Search Console validation treat anchor-only destinations (pages that do not have their own canonical URL) as non-canonical breadcrumb items. More specifically: `https://gemmology.dev/learn#fundamentals` is not a separate indexable URL — it is an on-page anchor on `/learn/`. Googlebot will follow the breadcrumb to `/learn/` and not find a distinct page for "Fundamentals", which degrades the breadcrumb trail's informativeness in rich results.
- **Why it matters**: Google uses BreadcrumbList to generate the breadcrumb path shown in organic search results below the page title. A broken or non-canonical intermediate breadcrumb item typically causes Google to fall back to its own path-based breadcrumb generation (deriving from the URL structure). The consequence is loss of the custom breadcrumb display — a minor CTR signal. More seriously, for subcategory pages the breadcrumb at position 4 points to the first entry in the subcategory (`subcatOverview`) which is a correct URL, but position 3 (category) uses the anchor pattern and breaks the chain.
- **Fix**: The category breadcrumb intermediate item should either (a) point to `/learn/` (the hub page) and rename to "Learn", making the chain Home → Learn → [Article Title], or (b) if a dedicated `/learn/fundamentals/` route is ever created, update to that canonical URL. Option (a) is the correct fix for the current URL structure. Update `LearnSchema.astro:67` to `"item": "https://gemmology.dev/learn"` and `"name": "Learn"` for the category list item, or remove the intermediate category item and use a three-item breadcrumb: Home → Learn → Article.

---

### F-10 — `robots.txt` has a duplicate `Sitemap:` directive pointing to `llms.txt`

- **Severity**: P3
- **Category**: Crawlability
- **Evidence**: `public/robots.txt:8` — `Sitemap: https://gemmology.dev/sitemap-index.xml` (correct). `public/robots.txt:12` — `Sitemap: https://gemmology.dev/llms.txt` (incorrect reuse of Sitemap directive for an LLM index file).
- **Why it matters**: The `Sitemap:` directive in `robots.txt` is defined by the Sitemaps protocol and the Robots Exclusion Protocol as pointing to an XML sitemap. Googlebot, Bingbot, and other crawlers that process `robots.txt` will attempt to fetch `https://gemmology.dev/llms.txt` as if it were an XML sitemap, fail to parse it (it is a plain text file), and log a sitemap parse error in Search Console. This does not block crawling but generates persistent sitemap errors and may cause Bing to deprioritise sitemap processing for the domain. The intent (advertising the LLM index) is correct but the wrong directive is used.
- **Fix**: Remove `Sitemap: https://gemmology.dev/llms.txt` from `robots.txt`. The `LLM-Content: https://gemmology.dev/llms.txt` directive on line 11 is the correct way to advertise the LLM index (per the llmstxt.org proposal). The `<link rel="alternate" type="text/plain" title="LLM index" href="/llms.txt" />` in `BaseLayout.astro:53` provides the in-document discovery mechanism. Both of those are correct — only the duplicate `Sitemap:` directive is wrong.

---

### F-11 — `BaseLayout.astro` title pattern is suffix-first ("gemmology.dev — Quiz"), reducing SERP scannability for branded queries

- **Severity**: P3
- **Category**: Meta Tags
- **Evidence**: `src/layouts/BaseLayout.astro:38-39` — `const fullTitle = isHome ? \`gemmology.dev — Crystal Visualization & FGA Reference\` : \`gemmology.dev — ${title}\``. For the quiz page this produces "gemmology.dev — Quiz". For learn pages: "gemmology.dev — Crystal Systems".
- **Why it matters**: The brand-first title pattern (`Brand — Page`) is a conventional choice but has a trade-off: on mobile SERPs where titles are truncated to approximately 50-55 characters, the pattern consumes 16 characters ("gemmology.dev — ") before the descriptive page label. For short labels like "Quiz" this wastes the truncation budget. More significantly, for keyword-targeted queries ("crystal systems gemmology", "FGA quiz practice") the page topic appears at position 17+ rather than position 1, reducing keyword prominence in the title — a confirmed, though small, ranking signal. Google rewrites approximately 60% of titles in SERPs; placing the descriptive label first reduces the probability of rewrite because the title already matches the likely query intent. The home page correctly handles this by making the full title descriptive; the pattern should be considered for the highest-value content pages.
- **Fix**: Consider reversing the title order for content pages: `${title} — gemmology.dev`. For the quiz: "Gemmology Quiz — FGA Practice Questions — gemmology.dev". For learn articles: "Crystal Systems — gemmology.dev". This is a low-priority change but is consistent with the approach used by most content-first educational sites (Khan Academy, Brilliant, Coursera all use Page Topic first).

---

### F-12 — `og:image` defaults to `/og-default.jpg` for all study pages; no per-page social image for quiz

- **Severity**: P3
- **Category**: Meta Tags
- **Evidence**: `src/layouts/BaseLayout.astro:32` — `const ogImage = image || new URL('/og-default.jpg', Astro.site).href`. `src/pages/quiz/index.astro` does not pass `image`. `src/pages/learn/[...slug].astro` does not pass `image`. The `/learn/` route has per-slug OG image generation at `src/pages/og/learn/[...slug].astro` — but this is not wired into the `<BaseLayout>` call in `src/pages/learn/[...slug].astro:117`.
- **Why it matters**: Social sharing of quiz or learn article URLs will use the generic site OG image for all pages. When a student shares a specific learn article on LinkedIn or Twitter, the social card does not differentiate between articles. This reduces click-through from social channels. The per-slug OG image route (`/og/learn/[...slug]`) already exists — it is simply not connected. For the quiz page specifically, the "Coming Soon" gate is doubly problematic: users who share `/quiz` get a generic card for a page that currently shows them a lock screen.
- **Fix**: In `src/pages/learn/[...slug].astro`, pass `image={\`/og/learn/${entry.id}\`}` (or the full URL) to `<BaseLayout>`. For `/quiz`, either omit the OG image entirely while gated (defaulting to site image is acceptable) or create `/og/quiz/` with static generated art when the page is public.

---

## Top P0/P1 Recap

Three findings require resolution before the release PR is merged.

**F-01 (P1) — Index the gate**: `/quiz` carries no `noindex` and Google will index a "Coming Soon" stub returning HTTP 200. This is a textbook soft-404 pattern. Add `noindex={true}` to `quiz/index.astro` immediately.

**F-02 (P1) — WRS rendering trap**: The `LockGate` component initialises with `isLoading: true`, rendering only a spinner during Googlebot's rendering window, because WRS has no `localStorage` access to resolve auth state. This is a structural problem with the current client:load rendering approach. Until the gate is removed, `noindex` (from F-01) is the correct mitigation.

**F-03 (P1) — LearnQuizWidget not wired**: The pretest widget is implemented but missing from all 91 learn article pages, causing the release checklist acceptance criterion to fail. This also blocks the legitimate `Quiz` schema opportunity on learn pages (F-04), since structured data must match visible content.

**F-06 (P1) — Missing study routes**: `/study/review` and `/study/settings` are documented, release-checklist gated, and expected by the IndexNow workflow, but the `src/pages/study/` directory does not exist. The release PR cannot pass its own checklist without these pages or a documented decision to remove them.

The remaining findings (F-04 through F-12) are P2/P3 improvements that can be addressed post-v1.0 without blocking the release, with the exception of F-10 (the duplicate `Sitemap:` directive in `robots.txt`) which is a one-line fix and should be included in the release branch.

# T7c — SEO/Crawlability Audit (study-system v1)

Read-only static audit of the study-system v1 changes on `feature/study-v1`.
Scope: route additions, sitemap inclusion/exclusion, robots, meta tags, JS-rendered indexability. No live-site fetching.

---

## F-01 — Dev harness route uses inline Astro layout, not BaseLayout

- **Severity**: P2
- **Evidence**: `src/pages/_dev/study-components.astro:8-17` declares its own `<!doctype html>` document and does not use `BaseLayout.astro`. It does correctly gate behind `import.meta.env.DEV` and returns a 404 in production.
- **SEO impact**: Because the page returns 404 in `astro build`, no static HTML is emitted — Astro's SSG routing skips routes that explicitly return 404. So crawlers cannot discover or index it. Risk is low. The bypass is the gate working as intended; missing layout means there's no `noindex` robots tag, but there's also no document.
- **Suggested fix**: Add a defensive `<meta name="robots" content="noindex, nofollow">` inside the inline `<head>` so that even if the gate ever regresses (e.g. someone removes the `import.meta.env.DEV` check), the page still de-indexes. One-line change.

---

## F-02 — Sitemap filter does not exclude `/_dev/*`

- **Severity**: P3 (defence-in-depth)
- **Evidence**: `astro.config.mjs:23` — `sitemap({ filter: (page) => !page.includes('/admin'), ... })`. Only `/admin` is excluded.
- **SEO impact**: With the current 404 gate the dev page is never built and so it never enters the sitemap. But if the `import.meta.env.DEV` check is removed accidentally, the route would auto-emit and the sitemap would include it. Cheap to harden.
- **Suggested fix**: Update the filter to exclude both: `filter: (page) => !page.includes('/admin') && !page.includes('/_dev/')`.

---

## F-03 — `/quiz` is auth-gated but not noindex

- **Severity**: P2
- **Evidence**: `src/pages/quiz/index.astro` wraps content in `<ProtectedQuiz>` (auth gate). `BaseLayout` defaults `noindex={false}` and the page does not pass `noindex`. The gate is rendered client-side; crawler sees a near-empty CTA shell.
- **SEO impact**: Google may index a thin gate page with little useful content, which dilutes site-wide quality signals and creates an unhelpful SERP entry ("Sign in to take quiz"). A signed-out crawler experience is also flagged by Google's "Indexing of paywall content" guidance — the public content (gate copy) doesn't reflect the value of the page.
- **Suggested fix**: Either (a) pass `noindex` from `quiz/index.astro` so the gate is excluded, or (b) render a static, content-rich SEO description of the quiz system above the gate so what's indexed is a real page, not the lock screen. Option (b) is preferable for visibility.

---

## F-04 — `/study/review` and `/study/settings` routes referenced in CLAUDE.md but not implemented

- **Severity**: P1 (broken-link risk)
- **Evidence**: `CLAUDE.md` lines describing v1 routes mention `/study/review` and `/study/settings`; `src/pages/study/` does not exist on this branch. Documentation was added by T6 but the dedicated routes were not built.
- **SEO impact**: Internal docs that reference non-existent routes create 404s if linked from the marketing site or learn pages, and confuse users hitting the URLs from release notes. `<StudySettingsPanel>` and `<ExportImportPanel>` components exist but are only consumed by the dev harness; production users have no path to them.
- **Suggested fix**: Add minimal `src/pages/study/settings.astro` and `src/pages/study/review.astro` pages that wrap the existing components in `BaseLayout`. Both should pass `noindex={false}` (or true if gated). If shipping without them, remove the documentation references in `docs/study-system.md` and `CLAUDE.md`.

---

## F-05 — Question YAML content is build-time data, correctly not crawlable

- **Severity**: Info
- **Evidence**: `src/content/config.ts:84` defines `questionsCollection` with `type: 'data'`. Astro `data` collections are JSON-loaded at build time and are NOT emitted as routes. `src/content/questions/**/*.yaml` (50 files post-T5a) generates zero crawlable URLs.
- **SEO impact**: Correct. Question content stays inside the React app, not search-indexable. This is the intended behaviour for a study/quiz product (we don't want crawlers leaking answers).
- **Suggested fix**: None. Document this decision in `docs/study-system.md` as a positive design choice.

---

## F-06 — Quiz/study UI is a React island, no pre-rendered content for crawlers

- **Severity**: P2
- **Evidence**: `src/pages/quiz/index.astro` renders `<ProtectedQuiz client:load entries={entries}/>` — an island. The static HTML emitted by Astro is a small skeleton; the question list and category navigation are client-rendered.
- **SEO impact**: Even if the gate were removed, a crawler without JS execution sees no quiz content. Modern Googlebot does render JS but pages relying on it for primary content rank lower than pages with server-rendered HTML.
- **Suggested fix**: Pre-render category overview, count of available questions, and "What you'll learn" copy into the Astro shell before mounting the React island. This gives crawlers something to index without exposing answer content.

---

## F-07 — `BaseLayout` `meta description` defaults to a generic site-wide string for all study pages

- **Severity**: P2
- **Evidence**: `src/layouts/BaseLayout.astro:18` — `description = 'Crystal structure visualization and gemmological reference for FGA students and professionals.'`. Several v1 routes (`quiz/index.astro`) do not override this.
- **SEO impact**: Identical meta descriptions across multiple URLs cause Google to flag duplicate snippets and re-write its own. Loss of CTR control on SERP.
- **Suggested fix**: Pass a route-specific `description` from each page that uses `BaseLayout`. For `/quiz`: "Practice gemmology with adaptive spaced-repetition quizzes — 50+ FGA-aligned questions with instant rationale and SM-2 scheduling."

---

## F-08 — Sitemap `lastmod` uses `new Date()` evaluated at build time

- **Severity**: P3
- **Evidence**: `astro.config.mjs:30` — `lastmod: new Date()`.
- **SEO impact**: Every sitemap entry gets the build timestamp regardless of whether the underlying page changed. Google deprioritises sitemaps where every URL claims to update simultaneously, treating the signal as noise.
- **Suggested fix**: Use per-page git commit timestamps via the sitemap integration's `serialize` hook, or use the content collection `pubDate` if present. As a minimum, scope `lastmod` only to the URLs whose content actually changed in this release.

---

## F-09 — `robots.txt` lacks Bing/IndexNow signals

- **Severity**: P3
- **Evidence**: `public/robots.txt` declares the sitemap and an `LLM-Content` line but no `IndexNow` ping endpoint.
- **SEO impact**: Out of scope of v1 study system but the release checklist references IndexNow for `/study/*` routes.
- **Suggested fix**: The IndexNow workflow exists in CI per `docs/release-checklist-study-v1.md`; this is an Info note. No change needed here, but ensure new study URLs are listed in the IndexNow batch when they exist (see F-04).

---

## Summary

5 of the 9 findings are P2 or P1. The two with the largest user-facing impact are **F-04** (missing `/study/*` routes that docs already describe) and **F-03** (the `/quiz` gate page is indexable and would create a thin-content SERP entry). Everything in the new study-system code emits correctly to the static build, the dev harness is properly gated, and question YAML stays build-time-only — so v1 itself does not regress SEO. The recommendations are: (a) ship minimal `/study/settings` and `/study/review` pages this release or strip the docs references, (b) noindex the `/quiz` gate or enrich it with public copy, (c) harden the sitemap filter to exclude `/_dev/*` even if the env-gate ever fails.

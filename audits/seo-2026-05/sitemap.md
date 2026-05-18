# Sitemap & Indexability Audit

**Date:** 2026-05-11
**Audited file:** `dist/sitemap-0.xml` (via `dist/sitemap-index.xml`)

---

## TL;DR

910 URLs are in the sitemap. 442 of them are OG image template pages that must never be indexed. 2 more are user-state pages with no crawlable content. The fix is a one-line filter change in `astro.config.mjs`. After the fix the sitemap will contain ~466 clean, indexable URLs — well under the 50,000-URL limit, no split required.

---

## Current sitemap inventory

| Path prefix | Count | Status |
|---|---|---|
| `/og/` | 441 | OG image templates — must be excluded |
| `/og-image/` | 1 | OG image template — must be excluded |
| `/minerals/` | 303 | Good |
| `/learn/` | 139 | Good |
| `/docs/` | 12 | Good |
| `/tools/` | 7 | Good |
| `/study/review/` | 1 | User-state page — must be excluded |
| `/study/settings/` | 1 | User-state page — must be excluded |
| `/quiz/` | 1 | Good |
| `/playground/` | 1 | Good |
| `/gallery/` | 1 | Good |
| `/about/` | 1 | Good |
| `/` | 1 | Good |
| **Total** | **910** | **442 must be removed** |

---

## Issues

### P0 — 442 OG image template pages indexed

`/og/learn/[...slug]` and `/og/minerals/[slug]` are Astro pages that render raw 1200x630 HTML cards intended only for `og:image` screenshot pipelines. They have no `<meta name="robots" content="noindex">` and are not excluded from the sitemap filter. Neither do they appear to set a canonical pointing elsewhere.

Confirmed from `src/pages/og/learn/[...slug].astro`: the file is a pure image-template component with no body content beyond social card markup. Google will crawl these, find near-duplicate thin content for every learn and mineral page, and may apply a doorway/thin-content signal across the site.

The `/og-image/` root template is the same class of problem.

Action: exclude all `/og` paths from the sitemap and add `<meta name="robots" content="noindex, nofollow">` to the OG template layout (or return a `X-Robots-Tag: noindex` header if served via middleware).

### P1 — /study/review and /study/settings indexed

`src/pages/study/review.astro` is an express SM-2 review queue driven entirely by `localStorage` (SM-2 schedule). A fresh Googlebot crawl sees an empty state with no meaningful content. `/study/settings` is a preferences panel. Both are user-state pages with zero indexable value.

Action: exclude from sitemap and add `noindex` meta to both pages.

### P2 — priority and changefreq fields present

`priority` and `changefreq` are ignored by Google (confirmed dropped ~2023). They add byte weight to every URL entry. Removing them has no negative effect and cleans up the XML.

Action: strip both fields from the `serialize()` callback. Retain `lastmod` only.

---

## Proposed astro.config.mjs filter patch

Replace the current single-line filter in `astro.config.mjs` with:

```diff
-      filter: (page) => !page.includes('/admin'),
+      filter: (page) =>
+        !page.includes('/admin') &&
+        !page.includes('/og/') &&
+        !page.includes('/og-image/') &&
+        !page.includes('/study/review') &&
+        !page.includes('/study/settings'),
```

Also update the `serialize` callback to drop deprecated fields:

```diff
       serialize(item) {
         if (item.url === 'https://gemmology.dev/' ||
             item.url === 'https://gemmology.dev/gallery/' ||
             item.url === 'https://gemmology.dev/learn/') {
-          item.priority = 1.0;
-          item.changefreq = 'weekly';
+          // priority and changefreq ignored by Google — omitted
         } else if (/\/minerals\/[^/]+\/$/.test(item.url)) {
-          item.priority = 0.8;
-          item.changefreq = 'monthly';
         } else if (/\/learn\//.test(item.url)) {
-          item.priority = 0.7;
-          item.changefreq = 'monthly';
         } else if (/\/docs\//.test(item.url)) {
-          item.priority = 0.5;
-          item.changefreq = 'monthly';
         }
         return item;
       },
```

Also remove the top-level `changefreq: 'weekly'` and `priority: 0.7` defaults from the sitemap integration options for the same reason.

---

## Proposed sitemap split

Not required. After removing the 442 excluded URLs the sitemap will contain approximately 466 URLs, well under the 50,000-URL per-file limit. A single `sitemap-0.xml` with index is sufficient.

---

## Post-fix expected inventory

| Path prefix | Count |
|---|---|
| `/minerals/` | 303 |
| `/learn/` | 139 |
| `/docs/` | 12 |
| `/tools/` | 7 |
| `/quiz/` | 1 |
| `/playground/` | 1 |
| `/gallery/` | 1 |
| `/about/` | 1 |
| `/` | 1 |
| **Total** | **466** |

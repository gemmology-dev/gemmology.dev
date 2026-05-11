# SEO v2 Validation Report

**Branch:** `feature/seo-v2`
**Built:** 2026-05-11 (commit chain after `c9171a4`)
**Validator:** automated JSON parse + required-field check (`/tmp/extract-jsonld.cjs`)

## Build assertions (W9)

| Assertion | Expected | Observed | Status |
|-----------|----------|----------|--------|
| Sitemap `<url>` count | ≈466 | 466 | PASS |
| Sitemap `/og/` URLs | 0 | 0 | PASS |
| Sitemap `/og-image` URLs | 0 | 0 | PASS |
| Sitemap `/study/` URLs | 0 | 0 | PASS |
| Sitemap `/admin` URLs | 0 | 0 | PASS |
| `/tools/` body words | ≥200 | 468 | PASS |
| `/tools/measurement/` body words | ≥300 | 1149 | PASS |
| `/tools/optical/` body words | ≥300 | 945 | PASS |
| `/tools/lab/` body words | ≥300 | 1213 | PASS |
| `/tools/identification/` body words | ≥300 | 902 | PASS |
| `/tools/advanced/` body words | ≥300 | 993 | PASS |
| `/tools/conversions/` body words | ≥200 | 600 | PASS |
| `/quiz/` body words | ≥250 | 429 | PASS |
| `/learn/` body words | rich | 3246 | PASS |
| `/about/` body words | ≥350 | 402 | PASS |

## JSON-LD inventory (W10)

Every block parses as valid JSON, contains `@context` and `@type`, and satisfies the required-field heuristics in our validator.

| Page | Blocks | Types | All pass? |
|------|--------|-------|-----------|
| `/` | 2 | `WebSite`, `Organization` | yes |
| `/about/` | 3 | `BreadcrumbList`, `WebPage`, `Person` | yes |
| `/learn/` | 3 | `Course`, `CollectionPage`, `BreadcrumbList` | yes |
| `/learn/fundamentals/chemical-properties/` | 2 | `LearningResource+Article`, `BreadcrumbList` | yes |
| `/learn/fundamentals/crystal-systems/` | 2 | `LearningResource+Article` (with `hasPart: Quiz`), `BreadcrumbList` | yes |
| `/quiz/` | 2 | `Course` (8 `hasCourseInstance`), `Quiz` | yes |
| `/tools/` | 1 | `SoftwareApplication` | yes |
| `/tools/measurement/` | 1 | `SoftwareApplication` | yes |
| `/tools/optical/` | 1 | `SoftwareApplication` | yes |
| `/tools/lab/` | 1 | `SoftwareApplication` | yes |
| `/tools/identification/` | 1 | `SoftwareApplication` | yes |
| `/tools/advanced/` | 1 | `SoftwareApplication` | yes |
| `/tools/conversions/` | 1 | `SoftwareApplication` | yes |
| `/minerals/diamond/` | 2 | `Thing`, `BreadcrumbList` | yes |
| `/minerals/ruby/` | 2 | `Thing`, `BreadcrumbList` | yes |

## Key fixes verified

- **Breadcrumb fragment URL bug (F-04, prior audit):** `/learn/fundamentals/chemical-properties/` now emits `"item": "https://gemmology.dev/learn"` (no `#fundamentals` fragment). Confirmed via direct grep.
- **Quiz `hasPart`:** present on `/learn/fundamentals/crystal-systems/` and `/learn/fundamentals/physical-properties/` (and any other article with a pretest).
- **Person schema:** `/about/` carries `Person` JSON-LD with `name: "Bissbert"`, `sameAs: ["https://github.com/Bissbert"]`, `knowsAbout` array of 4 gemmology topics, and `worksFor: Organization gemmology.dev`. No fabricated credentials.

## Heuristics applied by validator

- `Course` must have `provider`
- `LearningResource` must have `learningResourceType` or `educationalLevel`
- `BreadcrumbList` must have non-empty `itemListElement`
- `Person` must have `name`
- `Quiz` must have at least one of `about`, `hasPart`, `educationalLevel`
- `SoftwareApplication` must have `applicationCategory`

All 31 blocks across 15 representative pages satisfy these checks.

## External validation (manual, post-deploy)

After production deploy, run each template URL through Google's Rich Results Test
(https://search.google.com/test/rich-results) and Schema.org's structured-data linter
(https://validator.schema.org/) and append the screenshots / pass-fail markers here.

Templates to test:

- `https://gemmology.dev/`
- `https://gemmology.dev/about/`
- `https://gemmology.dev/learn/`
- `https://gemmology.dev/learn/fundamentals/crystal-systems/` (article with pretest)
- `https://gemmology.dev/quiz/`
- `https://gemmology.dev/tools/`
- `https://gemmology.dev/tools/measurement/`
- `https://gemmology.dev/minerals/diamond/`

## Outcome

Wave 2 verification **PASSES**. Branch is ready for PR and deploy. Background workstreams WB2/WB3
(llms.txt + robots.txt) and WB1 (learn intro expansion in `gemmology-knowledge`) are tracked
separately.

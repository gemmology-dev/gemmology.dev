# Schema.org Coverage Audit — gemmology.dev
**Date**: 2026-05-11  
**Auditor**: Schema.org specialist (static analysis, read-only)  
**Scope**: All Astro page templates and SEO component files  
**Prior audit**: T7c-seo.md (F-04 baseline for this document)

---

## 1. Current-State Inventory

### Schema components

| File | Types emitted | Used by |
|------|--------------|---------|
| `src/components/seo/LearnSchema.astro` | `LearningResource + Article`, `BreadcrumbList` | `/learn/[slug]` |
| `src/components/seo/MineralSchema.astro` | `Thing` (Wikidata additionalType), `BreadcrumbList` | `/minerals/[slug]` |
| `src/components/seo/StructuredData.astro` | `BreadcrumbList`, `WebPage` (optional) | `/about` |
| `src/pages/index.astro` (inline) | `WebSite` (with `SearchAction`), `Organization` | `/` |

### Pages with no schema at all

| Page / template | Notes |
|----------------|-------|
| `/tools/*` (all 7 routes) | No schema block at any level |
| `/quiz` | No schema block |
| `/study/review`, `/study/settings` | No schema block |
| `/gallery` | No schema block |
| `/playground` | No schema block |
| `/learn/index` | No schema block |

### Validation results

**`LearnSchema.astro` — LearningResource + Article block**
- `@context` is `https://schema.org` — PASS
- `@type` array valid — PASS
- `isAccessibleForFree` present — PASS
- `datePublished` missing: the `publishedAt` content-config field is never passed into the component (only `dateModified` is wired, via file mtime fallback). Strictly optional for Article but recommended — FLAG
- `educationalLevel` passes raw difficulty string ("beginner" / "intermediate" / "advanced") without mapping to a schema `DefinedTerm` — INFO
- `teaches` is the category label string only; `about` duplicates it as a bare `Thing` — PASS (acceptable)
- No `url` / `@id` self-reference on the main entity — FLAG (Google's Article validator expects `mainEntityOfPage` or a `@id` match to canonical; `mainEntityOfPage` is present, so technically fine)

**`LearnSchema.astro` — BreadcrumbList**
- Position 3 `item` is a fragment URL (`/learn#${category}`) — **FAIL** (confirmed by F-09 in T7c-seo.md; not fixed in current branch)

**`MineralSchema.astro` — Thing block**
- `@type: "Thing"` with Wikidata `additionalType` — valid; no native Google rich-result type exists for minerals, so this is the correct approach — PASS
- `additionalProperty` array contains a `false` guard (`mineral.system && {...}`) but the filter(Boolean) cleans it — PASS
- `BreadcrumbList` position 2 points to `/gallery` but `/gallery` is not a parent of `/minerals/[slug]` in the URL hierarchy (`/minerals/` is) — FLAG (minor; breadcrumb is still useful but misleading)

**Homepage inline schemas**
- `WebSite` `SearchAction` `urlTemplate` points to `/gallery?search=` — valid — PASS
- `Organization` missing `description` — INFO (recommended, not required)
- Both blocks use `https://schema.org` — PASS

**`StructuredData.astro` — WebPage + BreadcrumbList**
- Component is correct and generic; only wired to `/about` — PASS

---

## 2. Recommended Additions by Page Template

### 2-A. `/learn/index` — Course

The ordered sequence of 91 articles across 8 categories is architecturally a course. A `Course` entity on the hub page is the single highest-impact addition available, directly addressing F-04 from T7c-seo.md.

**Required properties**: `name`, `description`, `provider`  
**Recommended**: `educationalLevel`, `teaches`, `hasCourseInstance`, `url`  
**Priority**: High

### 2-B. `/learn/[slug]` — Quiz hasPart (conditional)

The pretest widget is now wired (F-03 resolved in current branch — `LearnQuizWidget` is imported and rendered when `pretestQuestions.length > 0`). Pages that render the widget legitimately emit quiz content. A `hasPart` Quiz node should be added to the `articleSchema` in `LearnSchema.astro` when questions are available.

This requires passing a `hasPretest: boolean` prop into `LearnSchema.astro` and conditionally appending the `hasPart` node.

**Note on FAQPage**: Confirmed ineligible per F-05. Do not add.

**Priority**: Medium (after Course, as individual article Quiz signals are less impactful than the Course entity)

### 2-C. `/tools/*` — SoftwareApplication

The tools hub and each tool category page expose interactive calculators that run in the browser without login. `SoftwareApplication` is a valid Google-supported type for browser-based apps and unlocks no dedicated rich result, but strengthens entity understanding and supports GEO/AI citations.

**Required properties**: `name`, `applicationCategory`, `operatingSystem`  
**Recommended**: `description`, `url`, `featureList`, `offers` (free)  
**Priority**: Medium

### 2-D. `/minerals/[slug]` — DefinedTerm

The mineral detail pages are definitional reference entries. `DefinedTerm` (subtype of `Intangible`) is more semantically precise than bare `Thing` for a glossary-style entry. `DefinedTermSet` can be declared on `/gallery` to frame the collection.

The existing `Thing` + Wikidata `additionalType` approach is not wrong; adding `DefinedTerm` as a second `@type` in the array makes the entity classification explicit.

**Required properties** (DefinedTerm): `name`, `inDefinedTermSet`  
**Priority**: Medium

### 2-E. `/gallery` — DefinedTermSet + CollectionPage

A `DefinedTermSet` entity at `/gallery` provides the container for all mineral `DefinedTerm` entities. A `CollectionPage` `@type` signals to Google that the page is a browsable catalogue, which is accurately descriptive.

**Priority**: Low–Medium

### 2-F. `/playground` — SoftwareApplication

The CDL playground is a browser-based coding tool. Same `SoftwareApplication` treatment as tools.

**Priority**: Low

### 2-G. `/quiz` — Course (exam-prep framing) + LearningResource

The quiz page itself describes an FGA exam-preparation practice tool. A `Course` entity with `educationalCredentialAwarded` pointing to an `EducationalOccupationalCredential` describing the FGA diploma gives Google the credential-preparation signal. This is distinct from the `/learn/index` Course — the quiz Course would reference the learn articles as `syllabusSections`.

**Note**: Do NOT claim the site awards the FGA credential; use the `prepares` / `educationalCredentialAwarded` property to reference the external credential only.

**Priority**: Low (quiz is currently noindex-candidate per F-01; add schema only once publicly indexed)

---

## 3. Fix for Existing Failures

**BreadcrumbList position 3 fragment URL** (`LearnSchema.astro:73`)  
Change `"item": \`https://gemmology.dev/learn#${category}\`` to `"item": "https://gemmology.dev/learn"` and `"name": "Learn"`. This collapses the breadcrumb to Home → Learn → Article (3 items) or Home → Learn → Subcategory → Article (4 items when subcategory present). Confirmed not fixed in branch `feature/tools-wave-c`.

---

## 4. Ready-to-Drop JSON-LD Payloads

### 4-A. `/learn/index` — Course

Add to `src/pages/learn/index.astro` inside a `<Fragment slot="head">`:

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": "https://gemmology.dev/learn",
  "name": "Gemmology Foundation — FGA Curriculum Reference",
  "description": "91 structured articles covering crystal systems, optical and physical properties, gem species, identification procedures, treatments, and market knowledge. Aligned with the FGA Foundation and Diploma syllabi.",
  "url": "https://gemmology.dev/learn",
  "inLanguage": "en",
  "isAccessibleForFree": true,
  "educationalLevel": "beginner to advanced",
  "teaches": "Gemmology",
  "about": {
    "@type": "Thing",
    "name": "Gemmology"
  },
  "provider": {
    "@type": "Organization",
    "name": "gemmology.dev",
    "url": "https://gemmology.dev"
  },
  "educationalCredentialAwarded": {
    "@type": "EducationalOccupationalCredential",
    "name": "FGA — Fellow of the Gemmological Association",
    "credentialCategory": "Professional Certification",
    "recognizedBy": {
      "@type": "Organization",
      "name": "Gemmological Association of Great Britain",
      "url": "https://gem-a.com"
    }
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online",
    "courseWorkload": "PT2H",
    "instructor": {
      "@type": "Organization",
      "name": "gemmology.dev",
      "url": "https://gemmology.dev"
    }
  }
}
```

### 4-B. `/learn/[slug]` — Quiz hasPart patch for LearnSchema.astro

Add a `hasPretest` boolean prop to the component interface. When true, spread this into `articleSchema`:

```json
"hasPart": {
  "@type": "Quiz",
  "name": "Pretest",
  "description": "A short knowledge-check before reading this article.",
  "educationalUse": "Assessment",
  "url": "https://gemmology.dev/learn/SLUG"
}
```

The `url` should match the article URL (the quiz is embedded in-page, so the article URL is correct per schema.org guidance for inline assessments).

### 4-C. `/minerals/[slug]` — DefinedTerm upgrade

In `MineralSchema.astro`, change `"@type": "Thing"` to `"@type": ["Thing", "DefinedTerm"]` and add:

```json
"inDefinedTermSet": {
  "@type": "DefinedTermSet",
  "name": "Gemmology Mineral Reference",
  "url": "https://gemmology.dev/gallery"
}
```

### 4-D. `/tools/*` — SoftwareApplication

Add to each tool category page (example for `/tools/measurement`):

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Gemmological Measurement Tools",
  "description": "Browser-based calculators for specific gravity, refractive index, birefringence, critical angle, and carat estimation.",
  "url": "https://gemmology.dev/tools/measurement",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Any (web browser)",
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "provider": {
    "@type": "Organization",
    "name": "gemmology.dev",
    "url": "https://gemmology.dev"
  }
}
```

A shared `ToolsSchema.astro` component accepting `name`, `description`, and `url` props avoids repeating this across the 6 category pages. The BreadcrumbList (Home → Tools → [Category]) should also be added via `StructuredData.astro`.

---

## 5. Prioritised Implementation Order

| Priority | Page | Addition | Effort |
|----------|------|----------|--------|
| 1 | `/learn/index` | Course + EducationalOccupationalCredential | ~30 min |
| 2 | `LearnSchema.astro` | Fix fragment URL in BreadcrumbList | 2 min |
| 3 | `LearnSchema.astro` | Quiz `hasPart` (conditional on hasPretest prop) | ~20 min |
| 4 | All `/tools/*` | New `ToolsSchema.astro` + BreadcrumbList via StructuredData | ~45 min |
| 5 | `MineralSchema.astro` | DefinedTerm upgrade + DefinedTermSet ref | 10 min |
| 6 | `/gallery` | DefinedTermSet + CollectionPage | ~20 min |
| 7 | `/playground` | SoftwareApplication | 15 min |

Items 1–3 close the gap vs knowledge.gemmology.dev by expressing the educational hierarchy (Course containing LearningResource articles containing Quiz pretests) that Google's Education SERP features and AI overviews consume. Items 4–7 improve entity classification for tools and the mineral catalogue but have no direct rich-result unlock.

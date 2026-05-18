# Content & E-E-A-T Audit — gemmology.dev vs knowledge.gemmology.dev
**Audited:** 2026-05-11 | **Auditor role:** Content Quality / Google QRG Sept 2025

---

## TL;DR

knowledge.gemmology.dev serves flat Markdown files that Googlebot reads in a single HTTP request. gemmology.dev serves the same information better — but buries it inside client:load React islands that Googlebot either skips or defers. The ranking gap is not an E-E-A-T gap; it is a crawlability gap masquerading as one.

- **Content quality score (gemmology.dev /learn/):** 78/100
- **Content quality score (gemmology.dev /tools/):** 31/100
- **E-E-A-T overall (gemmology.dev):** 61/100 — credible but anonymous

---

## Why knowledge.gemmology.dev wins on content

1. **Full prose at first byte.** Every Markdown file delivers 300–800 words of body text, structured tables, and callouts in the initial HTML response. No JavaScript required.
2. **Consistent heading hierarchy.** Each doc has one H1, logical H2 sections (RI, Birefringence, Pleochroism, Dispersion), and inline code examples. This is exactly what Google's citation pipeline extracts for featured snippets and AI Overviews.
3. **Quotable facts in plain text.** Sentences like "High birefringence causes visible doubling of back facet edges — diagnostic for zircon, sphene, and peridot" are extractable verbatim. Google rewards prose that answers a question in one sentence.
4. **No duplicate-content risk.** Each doc covers one topic; canonical structure is implicit.

---

## gemmology.dev content gaps

### P0: Thin client-rendered pages

Every page under `/tools/` pre-renders exactly two elements: one H1 and one `<p>` description sentence (confirmed in `src/pages/tools/measurement.astro`). The React island (`<MeasurementTools client:load />`) loads after JavaScript executes. Googlebot's first-wave crawl sees 22 words of indexable content on a page that actually delivers 8 calculators and a reference table.

The same pattern applies to `/tools/optical`, `/tools/lab`, `/tools/identification`, `/tools/advanced`, `/tools/conversions`, `/quiz`, and `/playground`. Combined these are roughly 50 URLs with sub-50-word pre-rendered bodies.

**Impact:** Google's quality systems classify these as thin pages. Because they share the same domain as the /learn/ content, they dilute the site's topical authority signal across the whole property.

### P1: Missing E-E-A-T signals

The `/about` page covers editorial standards and source citations well (FGA alignment, Anderson/Webster, GIA journal, Mindat.org). However:

- **No named author or reviewer.** Every learn article and mineral page omits a byline. The about page refers to "the gemmology-dev open-source project" — a GitHub org, not a person. Google's QRG explicitly requires a named, credentialled individual for YMYL-adjacent educational content.
- **No author schema.** `MineralSchema.astro` and `StructuredData.astro` emit `WebPage` and `BreadcrumbList` but no `author` or `Person` node.
- **dateModified is present on /learn/ pages** (confirmed in project notes) — this is a genuine positive signal that knowledge.gemmology.dev lacks.
- **No "last reviewed" visible text on tool pages.** It exists on learn articles; it must also appear on tool description sections.

E-E-A-T factor scores (gemmology.dev):

| Factor | Score | Weight | Weighted |
|--------|-------|--------|---------|
| Experience | 50/100 | 20% | 10 |
| Expertise | 65/100 | 25% | 16 |
| Authoritativeness | 55/100 | 25% | 14 |
| Trustworthiness | 70/100 | 30% | 21 |
| **Total** | | | **61/100** |

### P2: Missing topical hubs

`/learn/index.astro` renders a card grid of all 139 articles grouped by the 8 study categories. This is a strong internal hub. However there is no equivalent hub page for tools — `/tools/` links to 6 category pages but contains no prose explaining what gemmological measurement is or why each category matters. A 400-word hub introduction per category page would fix this.

---

## Page-by-page recommendations

| Page | Current pre-rendered words | Min for page type | Action |
|------|---------------------------|------------------|--------|
| `/tools/measurement` | ~22 | 500 (service) | Add 500-word SSR intro: what SG and RI measure, when to use each tool |
| `/tools/optical` | ~20 | 500 | Add prose: polariscope vs dichroscope workflow, when optic sign matters |
| `/tools/lab` | ~18 | 500 | Add prose: how spectroscope absorption bands are read, UV safety note |
| `/tools/identification` | ~15 | 500 | Add prose: systematic identification sequence, decision logic |
| `/tools/advanced` | ~20 | 500 | Add prose: treatment detection methodology, GIA proportion grading |
| `/tools/conversions` | ~12 | 300 | Add 1-paragraph context: metric/troy/decimal carat system history |
| `/quiz` | ~30 | 300 | Add description of FGA exam alignment and question categories |
| `/about` | ~350 | 500 | Add named contributor(s) with credentials; add `Person` schema |
| `/minerals/[slug]` | SSG, rich | meets threshold | Add `author`/`reviewer` schema node per mineral page |

---

## 5 example passages to add to tool pages

**measurement.astro intro:** Specific gravity and refractive index are the two primary quantitative tests in coloured-gemstone identification. SG is determined hydrostatically using Archimedes' principle — the gem is weighed in air and in water, and the ratio reveals density to two decimal places, enough to separate spinel (3.60) from synthetic spinel (3.52) or glass fills. RI is read directly from a critical-angle refractometer and narrows identification to a handful of species within seconds.

**optical.astro intro:** The polariscope and dichroscope answer different questions. The polariscope tests whether a stone is singly or doubly refractive, which separates isotropic species (diamond, spinel, garnet) from all others at a glance. The dichroscope reveals how many distinct body colours a stone shows in different vibration directions — a tanzanite shows blue, violet, and bronze, while a synthetic blue spinel shows only one colour. Neither instrument requires a prepared surface, making them ideal first-pass tests.

**lab.astro intro:** The spectroscope records which wavelengths of visible light a gem absorbs. Strong selective absorption bands are diagnostic: the 693 nm doublet in ruby, the 450 nm band in synthetic blue spinel, the 415 nm line in cape diamonds. UV fluorescence adds a complementary data point — a strong blue LWUV reaction in diamond, absent under SWUV, points away from moissanite or CZ without any contact with the stone.

**identification.astro intro:** Systematic gem identification follows a fixed sequence to avoid confirmation bias. Start with non-destructive observations — colour, transparency, lustre — then move to RI, then SG, then spectroscope if the RI falls in an ambiguous range. Only after these quantitative steps should qualitative tests (Chelsea filter, fluorescence) be applied to confirm or refute a working hypothesis. This sequence matches the FGA Diploma practical examination protocol.

**advanced.astro intro:** Treatment detection requires correlating multiple lines of evidence. Heat treatment in corundum leaves characteristic stress fractures around rutile inclusions and healed fingerprints, but not all heated stones show these features. The treatment wizard on this page assigns positive or negative evidence weights to each observable clue and surfaces a confidence-banded conclusion — high confidence when three or more independent indicators align, low confidence when evidence is mixed or a single clue stands alone.

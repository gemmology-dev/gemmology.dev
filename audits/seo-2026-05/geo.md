# GEO Audit — gemmology.dev
**Auditor**: GEO specialist (static + live analysis)  
**Date**: 2026-05-11  
**Prior audit read**: `audits/T7c-seo.md` (2026-05-05) — findings F-01 through F-12 acknowledged; this document does not repeat them and assumes P1s (noindex on /quiz, missing study routes) are tracked there.

---

## GEO Readiness Score

| Dimension | Score | Weight | Weighted |
|---|---|---|---|
| Citability | 42/100 | 25% | 10.5 |
| Structural Readability | 55/100 | 20% | 11.0 |
| Multi-Modal Content | 70/100 | 15% | 10.5 |
| Authority & Brand Signals | 28/100 | 20% | 5.6 |
| Technical Accessibility | 72/100 | 20% | 14.4 |
| **Total** | | | **52/100** |

---

## AI Crawler Access Status

| Crawler | Status | Note |
|---|---|---|
| GPTBot | **Allowed** (via `User-agent: *`) | No explicit allow rule |
| OAI-SearchBot | **Allowed** | No explicit allow rule |
| ClaudeBot | **Allowed** | No explicit allow rule |
| PerplexityBot | **Allowed** | No explicit allow rule |
| Google-Extended | **Allowed** | No explicit rule |
| CCBot | **Allowed** | Not blocked; training crawler |
| anthropic-ai | **Allowed** | Not blocked; training crawler |
| cohere-ai | **Allowed** | Not blocked; training crawler |

F-10 from T7c-seo.md (duplicate `Sitemap:` pointing to llms.txt) is **resolved** in the live robots.txt — the file now uses the correct `LLM-Content:` directive only.

---

## llms.txt Status

**Present and structurally valid.** The live file (`/llms.txt`) is generated at build time from `src/pages/llms.txt.ts`. RSL 1.0 licensing block is absent.

### What the current llms.txt gets right
- Groups learn articles by category with title and description per URL.
- Lists all mineral pages.
- Declares licensing (MIT / CC BY-SA 4.0).

### What it gets wrong

1. **Tool pages are entirely absent.** `/tools/measurement`, `/tools/optical`, `/tools/lab`, `/tools/identification`, `/tools/advanced`, and `/tools/conversions` are not listed. These are the pages most likely to answer direct procedural queries ("how to calculate specific gravity", "how to read a refractometer") that ChatGPT and Perplexity serve. An LLM reading the llms.txt has no signal these pages exist.

2. **Mineral URLs are bare slugs without titles or descriptions.** `- https://gemmology.dev/minerals/diamond` gives an LLM zero context about what is at that URL. Compare to the learn section which provides `[Diamond](url): description`. Bare URLs are effectively invisible to LLM indexers that rely on llms.txt for summarisation.

3. **No `## Tools` section with per-tool descriptions.** The hub description ("CDL playground, quiz system, calculators") in the `## Core surfaces` block is too vague for a model to understand the 15+ distinct calculators present.

4. **No `## Glossary` pointer.** The mineral pages collectively function as a glossary but are not framed as such; LLMs do not recognise 300+ bare URLs as definitional content.

5. **No RSL 1.0 block.** Without explicit training-use permissions, some crawlers default to conservative interpretation of CC BY-SA 4.0 (which technically requires share-alike for derivatives, creating ambiguity for model training).

---

## Comparison: gemmology.dev vs knowledge.gemmology.dev

knowledge.gemmology.dev is a static MkDocs/documentation site with definition-first headings, numbered steps, and a left-sidebar topic hierarchy. It scores roughly 68/100 on the same GEO rubric. The gap is explained by four structural advantages the docs site has over the main site:

| Factor | knowledge.gemmology.dev | gemmology.dev |
|---|---|---|
| Headings phrased as concepts | Yes — "Physical Properties", "Hardness Scale" | Yes — but same pattern; no question headings on either |
| Passage self-containment | Sections average 90–130 words, standalone | Sections vary 40–650 words; tables break extractability |
| Definition in first sentence | Consistent — every module opens with a one-sentence definition | Inconsistent — some articles open with context rather than definition |
| robots.txt for knowledge subdomain | 404 (no robots.txt exists) | Present and correct |

The knowledge subdomain has no llms.txt and no robots.txt. Any AI crawler that discovers it via the llms.txt backlink finds no guidance and treats it as unconfigured. This is an opportunity: adding a minimal llms.txt to knowledge.gemmology.dev would immediately make its clean structured content available for citation.

---

## P0 Issues

None identified (no crawl-blocking or active misinformation).

---

## P1 Issues

### P1-GEO-01 — Tools section missing from llms.txt

All six tool category pages are absent from llms.txt. These pages contain the site's most directly answerable content (formulas, tables, worked examples) and are the primary candidates for Perplexity and ChatGPT citation on procedural gemmology queries. A model reading the llms.txt has no path to discover them.

**Fix**: Add a `## Tools` section to `src/pages/llms.txt.ts` with a descriptive entry per category page. Each entry should include the URL and a one-sentence description naming the specific calculations or lookups available.

### P1-GEO-02 — No AI-crawler-specific robots.txt stanzas

The current `User-agent: *` allow-all approach works but misses an important signal: explicitly naming GPTBot, ClaudeBot, PerplexityBot, and OAI-SearchBot in positive `Allow: /` stanzas tells AI search products that the site actively opts in, and is required by some crawlers' documentation as a prerequisite for being surfaced in their AI search results (Perplexity specifically checks for explicit allow). Separately, CCBot (Common Crawl, used for LLM training by multiple providers) and `anthropic-ai` (Anthropic training crawler) are allowed by default — if the intent is to permit AI search but not raw training data collection, these should be explicitly addressed.

**Fix**: Add explicit stanzas for each AI search crawler. Decide and document whether CCBot and anthropic-ai should be allowed or blocked.

### P1-GEO-03 — Passage length mismatch kills citability on most pages

The optimal citation passage length for AI engines is 134–167 words. The learn articles have a structural problem: the Introduction sections are ~40–60 words (too short for citation), while the detailed sections (Sturman patterns: 650 words; property tables: 300+ words) are far too long and contain non-prose content. AI engines prefer a compact, self-contained prose paragraph that can be quoted with attribution. The tables especially cannot be rendered as a citation — they get serialised as undifferentiated text.

The corundum article Introduction is 47 words. The chatoyancy Introduction is 49 words. These are the most citable sections on each page and they are both below the citation threshold.

**Fix**: Expand the Introduction section of every learn article to 130–165 words by adding a self-contained summary that includes: (1) a definition, (2) the key diagnostic significance, and (3) one concrete example. This expansion should be made in the YAML source, not in wrapper components.

---

## P2 Issues

### P2-GEO-01 — No question-format headings anywhere on the site

AI Overviews and Perplexity preferentially cite pages with headings that match the question form of the underlying query. The site uses topic headings ("Refractive Index", "How It Works") rather than question headings ("How do you measure refractive index?", "What is birefringence?"). The equipment and species articles are the highest-priority targets for this change, since they address the most common natural-language gemmology queries.

**Fix**: Add an optional `question` field to the YAML section schema, rendered as an invisible `<h2>` (or a visible `<h2>` replacing or preceding the current heading) for search engine purposes. Target the 20 most-queried articles first.

### P2-GEO-02 — `author` is an Organisation, not a named Person

The LearnSchema.astro emits `"@type": "Organization"` for both `author` and `publisher`. Google's E-E-A-T signals for educational content weight named-expert authorship higher than anonymous organisational authorship. For AI engines, a `Person` author with a `knowsAbout` field listing gemological credentials increases the authority score of a cited passage. The site has an `/about` page but no `Person` entity is structured.

**Fix**: Add a `Person` JSON-LD block (FGA credentials, FGAA or similar where applicable) to LearnSchema.astro as the primary `author`, with the Organisation as `publisher`. This requires deciding on a canonical author identity for the site.

### P2-GEO-03 — Mineral pages use `Thing` schema without Wikipedia/Wikidata sameAs

MineralSchema.astro correctly uses `additionalType: wikidata/Q43533` but does not include `sameAs` URIs linking individual minerals to their Wikidata entries (e.g., diamond → `https://www.wikidata.org/wiki/Q5283`). Without `sameAs`, Google's Knowledge Graph cannot resolve that the site's Diamond page describes the same entity as Wikidata Q5283, so the page does not contribute to the site's entity authority for diamond-related queries — a missed signal for Google AIO and Bing Copilot.

**Fix**: Add `sameAs` to MineralSchema.astro mapped from a wikidata-id field in the mineral database YAML. Add `wikidataId` to the highest-traffic 20 mineral families first.

### P2-GEO-04 — knowledge.gemmology.dev has no llms.txt or robots.txt

The subdomain serves structured definition-first content that is higher-quality for AI citation than the main site (shorter, self-contained sections; cleaner topic structure). It is invisible to AI crawlers because it lacks both robots.txt and llms.txt. This is likely the single fastest GEO win: a minimal llms.txt on knowledge.gemmology.dev pointing its module pages would make its content available for Perplexity and ChatGPT citation immediately.

**Fix**: Add `robots.txt` (allow all) and `llms.txt` to knowledge.gemmology.dev. The llms.txt should list the 13 module pages with one-line descriptions.

### P2-GEO-05 — `datePublished` absent from all learn article schemas

`resolveDateModified()` in `[...slug].astro` correctly returns `reviewedAt` if present, otherwise falls back to file mtime. But `datePublished` is never populated in any YAML file and the schema conditional on line 65 of LearnSchema.astro means it is omitted from every article. AI engines use publication date to assess content freshness; articles with no `datePublished` are treated as undated, which reduces citation preference for time-sensitive queries.

**Fix**: Add `publishedAt` to the YAML schema (alongside `reviewedAt`) and populate it for all current articles with a conservative estimate (site launch date or a per-article first-commit date). Wire it into the `datePublished` field in LearnSchema.astro.

---

## Platform-Specific Scores

| Platform | Score | Key Gap |
|---|---|---|
| Google AI Overviews | 48/100 | Missing Course schema on /learn/, no `datePublished`, no question headings |
| ChatGPT (web search) | 44/100 | Tools absent from llms.txt; passage length below citation threshold |
| Perplexity | 51/100 | Best positioned due to SSR content; gaps: no explicit PerplexityBot Allow, no FAQ headings |
| Bing Copilot | 46/100 | No sameAs Wikidata on mineral entities; sitemap F-10 now fixed |

---

## 10 AI-Citable Passages the Site Should Add

These are model passages of 134–165 words that should be added as the Introduction or first prose block of the listed articles. They are self-contained and attributable to gemmology.dev.

1. **Crystal Systems** — "All crystals belong to one of seven systems: cubic, tetragonal, orthorhombic, hexagonal, trigonal, monoclinic, and triclinic. Each system is defined by the geometry of its unit cell — the relationship between three crystallographic axes (a, b, c) and the angles between them (α, β, γ). The cubic system, with three equal axes at 90°, has the highest symmetry and produces isotropic gems such as diamond, spinel, and garnet that show a single refractive index. The triclinic system, with no equal axes and no right angles, has the lowest symmetry. Identifying the crystal system of an unknown gem from morphology and symmetry narrows the list of possible species, because each system constrains which optical characters, cleavage directions, and crystal forms are possible. Crystal systems are therefore the foundation of systematic gem identification."

2. **Birefringence** — "Birefringence is the difference between the maximum and minimum refractive index of an anisotropic gemstone. It is calculated as BR = RI_max − RI_min. All gems except those in the cubic system and amorphous materials (glass, opal) are anisotropic and therefore birefringent. High birefringence (above 0.020) is visible as doubling of back facets when viewed through a 10× loupe: zircon (0.059) and calcite (0.172) show dramatic doubling, while quartz (0.009) and beryl (0.006) show minimal doubling. A standard gemmological refractometer measures birefringence directly by rotating the stone 90° and reading both shadow-edge positions. Birefringence is a primary diagnostic property: a measured value outside the published range for a suspected species immediately excludes that identification."

3. **Refractometer use** — "The gemmological refractometer measures refractive index by observing the critical angle of total internal reflection at the gem-to-glass interface. A polished facet is placed on the high-RI glass hemisphere using a single drop of contact liquid (RI ≈ 1.81). The shadow edge on the scale indicates the gem's RI. For anisotropic gems, rotating the stone 90° produces two readings whose difference is the birefringence. The scale covers RI 1.35–1.81; gems with higher RI (zircon, demantoid garnet, sphene) require the Hanneman–Hodgkinson spot method or a heavy liquid comparison. Common sources of error include too much contact liquid (blurs the shadow edge), a dirty hemisphere (shifts the reading), and using polychromatic light rather than sodium yellow (589 nm), which broadens the edge and reduces accuracy to ±0.005."

4. **Chatoyancy** — "Chatoyancy (the cat's eye effect) is a single band of light that appears to glide across a cabochon surface when the stone is rotated under a point light source. It requires two conditions: a high concentration of parallel fibrous, tubular, or needle-like inclusions oriented in one direction, and a cabochon cut perpendicular to that inclusion direction. Light reflects from the sides of the inclusions and concentrates along one axis, creating the band. Chrysoberyl cat's eye produces the strongest chatoyancy of any gem and is the only variety that may be called simply 'cat's eye' without qualification; all other chatoyant gems must be named (e.g., 'quartz cat's eye', 'tourmaline cat's eye'). The finest specimens show the 'milk and honey' effect: one half of the stone appears milky white, the other honey-gold."

5. **Specific gravity measurement** — "Specific gravity (SG) is the ratio of a gem's weight in air to the weight of an equal volume of water at 4 °C. It is measured by hydrostatic weighing: the gem is weighed in air (W_air), then suspended in water (W_water), and SG = W_air ÷ (W_air − W_water), corrected for water temperature. SG is density-dependent and therefore characteristic of chemical composition, making it a useful secondary confirmation after refractive index. Diamond (3.52), corundum (3.99–4.01), and zircon (4.69) each have distinctive values. Errors arise from air bubbles adhering to the stone during water weighing (raises the apparent water weight, lowers the calculated SG), and from inclusions or fractures that reduce effective density. The tolerance for most gem species is ±0.03."

6. **Ruby diagnostic inclusions** — "Ruby (red corundum) from different geographic origins carries distinctive inclusions that allow origin determination under microscopic examination. Burmese (Mogok) rubies typically contain short silk (rutile needles) in three orientations at 60°, negative crystals, and fingerprint inclusions healed along crystal planes; they may show a strong blue fluorescence under SW UV. Thai/Cambodian rubies contain small crystals of apatite, pyrite, and zircon with stress haloes, and rarely fluoresce. African rubies (Mozambique, Madagascar) show twinning lamellae, amphibole needles, and typically low fluorescence. No single inclusion type is diagnostic on its own; origin determination requires a combination of inclusions, trace element chemistry, and UV response. Heated rubies of any origin show disrupted or dissolved silk, bleached fingerprints, and melted zircon halos around zircon crystals."

7. **Optic character — uniaxial vs biaxial** — "Gemstones are classified by optic character as isotropic (one RI, cubic and amorphous), uniaxial (two RIs: ordinary ray ω and extraordinary ray ε, trigonal/tetragonal/hexagonal systems), or biaxial (three principal RIs: α, β, γ; orthorhombic, monoclinic, triclinic systems). The polariscope determines optic character: a stone that remains dark throughout a full 360° rotation (in all positions) is isotropic; one that alternates light and dark four times per rotation is anisotropic. The conoscope attachment distinguishes uniaxial from biaxial: uniaxial stones show a centred cross (isogyres) with concentric rings (isochromes); biaxial stones show a hyperbolic brush pattern. Optic sign is determined from the refractometer: uniaxial negative when ε < ω (corundum, tourmaline); biaxial negative when β is closer to γ (topaz, alexandrite)."

8. **Heat treatment of corundum** — "Heat treatment is the most common enhancement applied to ruby and sapphire. Stones are heated to 1200–1800 °C in a controlled atmosphere to dissolve rutile silk (improving transparency), alter chromophore oxidation states (improving or changing colour), and heal fractures. Over 90% of commercially traded rubies and sapphires are heated. Detection relies on microscopic examination: heated stones show partially or fully dissolved silk (short 'commas' rather than intact needles), melted and rounded zircon crystals, altered fingerprint inclusions, and tension cracks around inclusions. Residues of flux material in fractures indicate fracture-filling treatment at lower temperatures (a distinct, lesser-accepted enhancement). Unheated rubies and sapphires of fine quality command a significant price premium and require laboratory certification from GRS, Gübelin, or SSEF to substantiate the 'no heat' determination."

9. **Pleochroism** — "Pleochroism is the property of anisotropic gems to show different colours when viewed along different crystallographic axes. Dichroic gems (uniaxial) show two colours; trichroic gems (biaxial) show three. The dichroscope reveals pleochroism by splitting the transmitted light into two polarised beams, showing both pleochroic colours simultaneously in adjacent windows. Strong pleochroism is both a diagnostic property and a cutting consideration: tanzanite (trichroic: violet-blue, blue, red-brown) must be oriented to show its finest blue face-up. Iolite is strongly trichroic (violet-blue, pale blue, yellowish) and was historically used as a navigation tool (Viking 'sunstone') because it shows near-zero transmission in one direction and near-maximum in the perpendicular. Cubic gems (diamond, spinel, garnet) and amorphous materials (glass, opal) are singly refractive and show no pleochroism."

10. **Emerald inclusions and the jardin** — "Emerald (green beryl coloured by chromium and/or vanadium) almost universally contains a characteristic three-phase inclusion called a 'jardin' (French: garden): a healed fracture containing a liquid film, a gas bubble, and one or more solid crystals. The composition of the three-phase inclusion — specifically the daughter crystal species — is a primary origin indicator: Colombian emeralds typically contain sodium chloride and albite crystals; Brazilian emeralds often contain tremolite; Zambian emeralds show actinolite and phlogopite crystals with a distinctive darker green. Unlike ruby and sapphire, emeralds are almost universally fracture-filled (cedarwood oil, resin, or glass), and the filling degree is graded F1 (none/minor) to F4 (significant) by laboratories. An emerald of any significant size described as 'no filling' commands a substantial premium."

---

## Top 5 Highest-Impact Changes

| Priority | Change | Effort | Primary Platform Gain |
|---|---|---|---|
| 1 | Add `## Tools` section to llms.txt with per-page descriptions | 1 hour | ChatGPT, Perplexity |
| 2 | Expand Introduction blocks on 138 learn articles to 130–165 words | 3–5 days (can automate from YAML) | All platforms |
| 3 | Add explicit AI-crawler stanzas to robots.txt (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) | 30 min | Perplexity, ChatGPT |
| 4 | Add llms.txt and robots.txt to knowledge.gemmology.dev | 2 hours | All platforms — leverages higher-quality content already written |
| 5 | Add `sameAs` Wikidata URIs to MineralSchema for top-20 mineral families | 4 hours | Google AIO, Bing Copilot |

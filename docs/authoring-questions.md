# Authoring Questions — Curator's Guide

> **Diataxis type:** How-to — goal-oriented guide for contributors authoring and reviewing curated questions.
>
> **Audience:** FGA-trained content reviewers and internal contributors writing questions for the `src/content/questions/` sidecar bank. This guide assumes familiarity with gemmological terminology and basic YAML editing; it does not assume programming experience.

---

## Who This Guide Is For

This guide is for the **curator** role described in V1-PLAN.md §10: the person who writes and reviews the question YAML files that form the expert-vetted item bank. You do not need to know TypeScript or Astro internals. You do need:

- FGA Foundation or equivalent qualification (or close supervision by someone who has one)
- A text editor with YAML support (VS Code with the YAML extension is recommended — the JSON Schema auto-complete works immediately after running `npm run schema:questions`)
- Git access to the repository (a GitHub account with contributor access)

The engineering infrastructure — the Zod schema, the validator, the CI gate — is maintained by the implementer track. If the validator rejects a file you believe is correct, raise the issue rather than working around it.

---

## The Five-Step Authoring Workflow

### Step 1 — Generate a stub file

Run the scaffold script from the repository root:

```bash
npm run question:new -- --category=species --slug=corundum-ri-002
```

This creates `src/content/questions/species/corundum-ri-002.yaml` pre-populated with every required field as a placeholder. The `--category` argument must be one of the eight categories (`fundamentals`, `equipment`, `species`, `identification`, `phenomena`, `origin`, `market`, `care`). The `--slug` argument becomes the file name and the question's unique `id`; use lowercase letters, digits, and hyphens only.

The generated stub looks like this:

```yaml
id: corundum-ri-002
stem: "TODO: write a scenario stem"
type: mcq
options:
  - text: "TODO: correct answer"
    isCorrect: true
    rationale: "TODO: why this is correct"
  - text: "TODO: plausible distractor"
    isCorrect: false
    rationale: "TODO: why this is wrong"
  - text: "TODO: plausible distractor"
    isCorrect: false
    rationale: "TODO: why this is wrong"
rationaleCorrect: "TODO: diagnostic principle"
difficulty: 3
category: species
conceptTags: []
unvetted: true
```

### Step 2 — Write the stem, options, and rationales

Replace every `TODO:` field. The example below is taken directly from V1-PLAN.md §4.2 and illustrates the expected quality level:

```yaml
id: corundum-ri-001
stem: |
  A polished red stone gives the following readings on standard lab instruments:
  RI 1.762–1.770, SG 4.00, uniaxial negative on the polariscope, strong red fluorescence
  under LWUV. What is the most likely identification?
type: mcq
options:
  - text: "Natural ruby (corundum)"
    isCorrect: true
    rationale: "All four readings are diagnostic of corundum: the RI range, SG 4.00, uniaxial
                negative optic character, and strong red LWUV fluorescence are textbook ruby."
  - text: "Spinel"
    isCorrect: false
    rationale: "Spinel is isotropic (single RI ≈ 1.718) and would not give a uniaxial reading.
                Burma spinel does fluoresce red under LWUV but the RI and optic character rule it out."
  - text: "Pyrope garnet"
    isCorrect: false
    rationale: "Pyrope is also isotropic with RI ≈ 1.730–1.760 and SG 3.7–3.9. Slight RI overlap
                but the uniaxial reading and SG 4.00 exclude it."
rationaleCorrect: |
  This is a near-miss case the FGA practical exam tests: three red gems with overlapping properties.
  The diagnostic chain is optic character first (eliminates spinel and pyrope as isotropic),
  then SG (eliminates remaining alternatives at 4.00).
difficulty: 3
```

Note that the stem is written in scenario form — a real instrument reading, a concrete situation — rather than a bare knowledge retrieval question ("What is the RI of corundum?"). Scenario stems are harder to write but generate significantly stronger learning outcomes; the bare-retrieval form is what the auto-generator produces and is explicitly flagged as unvetted.

### Step 3 — Add metadata fields

After the core question content, complete the metadata block:

```yaml
category: species
conceptTags: [refractive-index, specific-gravity, optic-character, fluorescence]
sourceArticle: species/corundum
examRelevance: FGA-diploma
confusionPairs: [spinel-001, pyrope-001]
similarTo: [corundum-ri-002, ruby-fluorescence-001]
authorReviewed: "FGA-reviewer-1"
lastReviewed: "2026-05-15T10:00:00Z"
unvetted: false
```

Field-by-field guidance:

- **`conceptTags`** — one to five lowercase, hyphenated tags matching the gemmological property tested. Use existing tags already in the bank where possible; new tags are fine but keep them stable.
- **`sourceArticle`** — the learn slug of the article that teaches this topic (e.g. `species/corundum` for `/learn/species/corundum`). The `LearnQuizWidget` uses this to surface pretests on the correct article.
- **`examRelevance`** — one of `FGA-foundation`, `FGA-diploma`, or `GIA-GG`. If in doubt, use `FGA-foundation`.
- **`confusionPairs`** — the `id` values of other questions that test the most common near-miss confusions. This is the metadata that powers near-miss interleaving: when a session includes `corundum-ri-001`, the interleaver ensures a spinel or pyrope question appears within the next five positions. Populating this field is high-value work.
- **`similarTo`** — broader grouping than `confusionPairs`; questions on the same topic or instrument reading pattern. Used as a secondary interleaving signal.
- **`authorReviewed`** — your reviewer handle or initials. Required before `unvetted` can be set to `false`.
- **`lastReviewed`** — ISO 8601 datetime of your review. Update this whenever you revise the question.
- **`unvetted: false`** — set this only when you are satisfied the item meets the quality bar below. Auto-generated items always carry `unvetted: true`.

### Step 4 — Validate locally

Before committing, run:

```bash
npm run validate:questions
```

The validator runs the Zod schema against every file in `src/content/questions/`. It exits with code 0 if all files are valid; it prints the failing file path and the specific schema violation otherwise. Common failures are documented in the "Common review failures" section below.

You can also check the current coverage of your category:

```bash
npm run questions:coverage
```

This prints a table of curated item counts per category, vetted versus unvetted, and highlights categories below the minimum threshold.

### Step 5 — Open a pull request

Push your branch and open a PR against `feature/study-v1` (or `main` after the v1 merge). CI will:

1. Run `npm run validate:questions` — any schema violation blocks the merge.
2. Run `npm run build` — confirms no Astro type errors from the new content collection entry.
3. (After v1.0) Run the unit test suite.

At least one other FGA-qualified reviewer should approve the rationale content before merge. Engineering review is not required unless you are modifying the schema or scripts.

---

## Quality Bar for Curated Items

> This section restates V1-PLAN.md §10 with additional worked examples.

A question passes review when it satisfies all of the following criteria.

### 1. Scenario stem

The stem describes a realistic situation — an instrument reading, an observation under the loupe, a client description — not a bare knowledge retrieval. Compare:

| Reject (auto-gen quality) | Accept (curated quality) |
|--------------------------|--------------------------|
| "What is the refractive index of corundum?" | "A red stone gives RI 1.762–1.770 on the refractometer, uniaxial negative on the polariscope. What is the most likely identification?" |
| "Which crystal system does tourmaline belong to?" | "A prismatic green stone shows strong pleochroism, a uniaxial interference figure, and RI 1.620–1.640. Which crystal system does it belong to?" |

### 2. Three options, one correct

Use three options (one correct, two distractors). The schema allows up to four options for cases where "all of the above" is genuinely useful, but three is the default. Psychometric research (Sridharan & Sivaramakrishnan 2025, DOI: 10.1186/s12909-025-08026-5) shows three-option items are equivalent to four-option items and halve the distractor-writing burden.

### 3. Plausible distractors — not absurd ones

Each distractor must represent an actual mistake an FGA Foundation student is likely to make. The gemmological confusion matrix is well-defined:

- Ruby, spinel, pyrope garnet (red stone near-misses)
- Emerald, chrome tourmaline, green glass, peridot (green stone near-misses)
- Alexandrite, colour-change sapphire (colour-change near-misses)
- Citrine, heat-treated amethyst (yellow/orange near-misses)

Distractors that are physically impossible or geologically absurd fail this criterion.

### 4. Per-distractor rationale

Every distractor needs a `rationale` field that explains precisely why that distractor is wrong in the context of this question. Simply restating the correct answer is not sufficient. The rationale should teach the diagnostic principle — which property, measurement, or observation rules the distractor out.

The correct-answer `rationale` (inside the `options` array) and the `rationaleCorrect` field serve different purposes:

- **Option-level `rationale`** — why this specific option is correct or wrong. Short; one to two sentences.
- **`rationaleCorrect`** — the broader diagnostic principle illustrated by the question. Reference the `/learn/[slug]` article section where the student can read more. This field is displayed as the teaching moment after submission in practice mode.

### 5. Difficulty anchored to the 1–5 scale

Use the following anchors. When in doubt, pilot the question on a student and adjust:

| Level | Description | Example |
|-------|-------------|---------|
| 1 | Direct recall, single property | "Corundum belongs to which crystal system?" |
| 2 | Two-step lookup, obvious distractors | "RI 1.544 and SG 2.65 is most consistent with which gem?" |
| 3 | Near-miss discrimination, two properties | "RI 1.762, uniaxial negative: ruby, spinel, or pyrope?" |
| 4 | Multi-property chain with subtle overlap | "RI 1.718, isotropic, red fluorescence: spinel or synthetic spinel?" |
| 5 | Full identification scenario with treatment detection | Complete instrument suite + inclusion description |

### 6. Citation format

Where a rationale makes a specific factual claim — a numerical property value, a diagnostic rule, a treatment detection method — cite the source using the inline marker format:

```yaml
rationaleCorrect: |
  The diagnostic chain for corundum is optic character first (uniaxial negative eliminates
  all isotropic species), then SG at 4.00. [ref:read-gemmology-3rd-p187]
references:
  - id: read-gemmology-3rd-p187
    text: "Read, P.G. (2008). Gemmology, 3rd ed. Elsevier. p. 187."
```

The `[ref:id]` marker is an inline anchor; the `references:` block lists the full citation. The T5b Citations track (biss-research:citation-verifier) verifies factual claims in question rationales and adds `# TODO: verify` comments on anything unverifiable.

---

## Voice and Tone

The study system addresses FGA Foundation and Diploma candidates who are serious students, not beginners being hand-held. The register is:

- **Clear and precise.** Use the correct gemmological term every time — do not simplify to colloquial equivalents.
- **Encouraging without being patronising.** Rationales should teach, not scold. "Spinel is singly refractive, which rules it out here" not "You forgot that spinel is isotropic!"
- **Diagnostic, not encyclopaedic.** The rationale is not a summary of everything known about the species. It answers one question: what distinguishes the correct answer from the distractor in this specific case?
- **Consistent with `/learn/` article voice.** The rationale for a question sourced from `species/corundum` should feel like a short extension of that article, not a different document.

No emojis. No rhetorical questions in stems ("Could this be ruby?"). No hedging in rationales ("It might be that...").

---

## Common Review Failures

The validator catches schema violations. The following failures pass the schema but fail the quality bar on human review.

### Failure 1 — Absurd distractor

```yaml
# Bad: no candidate would choose "obsidian" for a uniaxial negative red stone
- text: "Obsidian (volcanic glass)"
  isCorrect: false
  rationale: "Obsidian is amorphous and shows no birefringence."
```

The distractor must be something a student might plausibly confuse for the correct answer. Obsidian is not in the ruby confusion matrix.

### Failure 2 — Rationale restates the answer

```yaml
# Bad: does not explain the diagnostic reasoning
- text: "Spinel"
  isCorrect: false
  rationale: "Spinel is not the correct answer here."
```

The rationale must identify which property rules spinel out and why that property matters.

### Failure 3 — Bare-retrieval stem

```yaml
# Bad: this is auto-gen quality, not curated quality
stem: "What is the SG of diamond?"
```

Rewrite as a scenario: "A colourless stone tests adamantine lustre, inert under UV, and balances at SG 3.52. What is the most likely identity?"

### Failure 4 — `confusionPairs` left empty on a near-miss question

```yaml
# If the distractors are spinel-001 and pyrope-001, those ids go here
confusionPairs: []
```

When the question explicitly tests a known confusion pair, the `confusionPairs` field must be populated with the ids of the distractor questions. This is what powers near-miss interleaving and is the highest-value metadata in the bank.

### Failure 5 — `unvetted: false` without `authorReviewed`

The schema requires `authorReviewed` to be present when `unvetted` is `false`. The validator will catch this, but the underlying issue is that no item should leave draft state without a named reviewer taking responsibility for the content.

---

## Cross-references

- Question schema (Zod): `src/content/config.ts` (T4 track); `src/content/questions/_example/` for the template
- SM-2 quality mapping (how confidence affects scheduling): [docs/study-system.md](study-system.md#scheduling-algorithm)
- Interleaving mechanics (`confusionPairs` → `interleaver.ts`): [docs/study-system.md](study-system.md#components-and-routes)
- ADR for SM-2 vs FSRS: [docs/adr/0001-sm2-vs-fsrs.md](adr/0001-sm2-vs-fsrs.md)
- Coverage targets (quarterly milestones): V1-PLAN.md §10

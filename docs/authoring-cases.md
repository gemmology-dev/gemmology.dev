# Authoring Lab Simulation Cases — Curator's Guide

> **Diataxis type:** How-to — goal-oriented guide for contributors authoring and reviewing Lab
> Simulation cases.
>
> **Audience:** FGA-trained content reviewers and internal contributors writing case files for the
> `src/content/cases/` sidecar bank. This guide assumes familiarity with gemmological terminology
> and basic YAML editing; it does not assume programming experience. It mirrors
> [`authoring-questions.md`](authoring-questions.md) — read that guide first if you have not
> authored curated content in this repository before.

---

## Who This Guide Is For

This guide is for the **curator** role writing and reviewing Lab Simulation case files: scenario-driven
identification exercises where a learner chooses tests, interprets readings, narrows candidates, calls
a treatment, and reaches a final identification — scored by decision quality at every step, not just
the final answer. You do not need to know TypeScript or Astro internals. You do need:

- FGA Foundation or equivalent qualification (or close supervision by someone who has one)
- A text editor with YAML support
- Git access to the repository (a GitHub account with contributor access)

The engineering infrastructure — the Zod schema (`src/content/config.ts`), the validator
(`scripts/validate-cases.mjs`), the CI gate — is maintained by the implementer track. If the validator
rejects a file you believe is correct, raise the issue rather than working around it.

---

## What Is a "Case"?

A case is a single scenario, not a single question. It is a short sequence of **steps** (minimum 3,
one of which must be a `final-identification` step), each presenting the learner with a decision and
2–6 options. Options are tiered:

| Weight | Score | Meaning |
|--------|-------|---------|
| `optimal` | 10 | The expert move — the most efficient, most diagnostic choice available at this point |
| `acceptable` | 5 | A reasonable choice that still makes progress, but is slower, less complete, or less rigorous than optimal |
| `poor` | 0 | A choice that wastes time, ignores available evidence, or reaches a wrong conclusion |

Steps can have a `pointsMultiplier` (1–3) for higher-stakes decisions — a treatment call or final
identification should typically carry `pointsMultiplier: 2`.

Step types:

| Type | Purpose |
|------|---------|
| `choose-next-test` | Learner picks which instrument/test to reach for next |
| `reading-interpretation` | Learner interprets a reading just revealed (what does it rule in/out?) |
| `candidate-narrowing` | An explicit narrowing-the-field decision, usually after a second measurement |
| `treatment-call` | A treatment/enhancement determination based on inclusion or optical evidence |
| `final-identification` | The concluding identification + disclosure decision (exactly one per case) |

Each step may reveal **evidence items** (`evidenceRevealed`) — instrument readings, inclusion
descriptions, filter reactions — that accumulate in the learner's on-screen "evidence notebook" as
the case progresses. An option can also reveal evidence conditionally via `revealsEvidenceIds`,
referencing an `id` defined in some step's `evidenceRevealed` array.

---

## The Five-Step Authoring Workflow

### Step 1 — Generate a stub file

```bash
npm run case:new -- --category=identification --slug=dealers-ruby --difficulty=intermediate
```

This creates `src/content/cases/identification/dealers-ruby.yaml` pre-populated with a heavily
commented template: three example steps (`choose-next-test`, `reading-interpretation`,
`final-identification`), a `groundTruth` block, and a `debrief` block. The `--category` argument is
free-form (kebab-case) and becomes the containing directory; `--slug` becomes the file name and the
case's `id`. `--difficulty` is optional (default `intermediate`; one of `foundation`, `intermediate`,
`diploma`).

### Step 2 — Write the scenario

Replace every `TODO:` field. Write `backstory` and `specimenSummary` as a real bench situation — what
a client says, what the stone looks like before any testing — not a bare property dump. Instrument
readings and other diagnostic evidence belong in each step's `evidenceRevealed`, not in
`specimenSummary`.

For every step, write:

- a `prompt` framed as a real decision ("What's the most efficient first test on this stone?", not
  "What is the RI of corundum?")
- 2–6 `options`, each with a `weight`, matching `score` (10/5/0 — see the table above), and a
  `rationale` that teaches the diagnostic principle, not just restates the answer
- for `reading-interpretation` and `candidate-narrowing` steps, a `candidatesAfter` list per option
  showing what the working candidate field looks like after this decision

### Step 3 — Verify every property value

**This is the most important review step and the one most often skipped.** Every RI, SG,
birefringence, spectroscope band, fluorescence colour, or treatment-diagnostic claim in a case must
match the reference data actually used elsewhere on the site, with a citation:

- Species properties: `mineral-database` (`mineral-db info <family-id>`) — this is canonical.
- Spectroscope bands: `src/lib/spectroscope/reference-bands.ts` (`SPECTROSCOPE_REFERENCE`).
- Treatment clues: `src/lib/treatments/wizard.ts`'s clue list and weights.
- Fallback/common-gem tables: `src/lib/calculator/conversions.ts`'s `GemReference` data, used as a
  cross-check — values should sit inside its ranges, not merely near them.

Add a full citation to the case's `references` block for every factual claim (mirror the
`[ref:id]` inline-marker convention from `authoring-questions.md` if a rationale needs an inline
anchor). Do not set `unvetted: false` until this check is complete and a named reviewer has
signed off.

### Step 4 — Write the debrief

The `debrief.summary` restates the correct identification and why. `debrief.expertPath` is an ordered
list (minimum 1 entry, but aim for 3–5) of short imperative sentences describing the expert's actual
reasoning sequence through the case — this is what most differentiates a case from a quiz question:
it teaches a *procedure*, not just an answer. `debrief.furtherReading` is optional, freeform citation
strings for background reading beyond the formal `references` block.

### Step 5 — Validate and open a pull request

```bash
npm run validate:cases
```

The validator runs the Zod schema against every file in `src/content/cases/`, then applies lints the
schema alone cannot express (see "Validator Lints" below). It exits 0 if all files pass; it prints the
failing file path and specific violation otherwise.

Push your branch and open a PR. CI runs `validate:cases` automatically whenever any file under
`src/content/cases/**/*.yaml` changed, followed by the full build (confirming the new case renders at
`/study/cases/<id>/`). At least one other FGA-qualified reviewer should approve the scenario content
and property values before merge.

---

## Validator Lints

Beyond schema shape, `scripts/validate-cases.mjs` checks:

1. **Option ids unique per step.**
2. **At least one `optimal`-weight option per step** — every decision must have a demonstrably best
   answer.
3. **Exactly one `final-identification` step per case.**
4. **`candidatesAfter` length is non-increasing** across the sequence of steps that declare it (in
   step order across the whole case, on any step type — not only `candidate-narrowing` steps, since a
   `reading-interpretation` step can narrow the field too). Candidate narrowing should never widen the
   field a later step already narrowed.
5. **weight/score consistency** — `optimal` must score 10, `acceptable` must score 5, `poor` must
   score 0. If you have a deliberate, reviewed reason to deviate (e.g. a step weighted differently for
   pedagogical reasons), set `allowScoreOverride: true` on that option — this is a validator-only
   escape hatch, not a schema field consumed at runtime, so use it sparingly and document why in a
   YAML comment next to the option.
6. **Every `revealsEvidenceIds` entry resolves** to an evidence item `id` defined somewhere in the
   case's `evidenceRevealed` arrays. A dangling reference is always a content bug.

---

## Quality Bar for Curated Cases

A case passes review when it satisfies all of the following:

1. **Realistic scenario** — a specific stone, a specific situation (dealer, client, unknown parcel),
   not an abstract property list.
2. **Every step is a genuine decision** with a clear expert answer and at least one plausible
   near-miss distractor drawn from the real gemmological confusion matrix (see
   `authoring-questions.md`'s confusion-matrix list).
3. **Evidence reveal matches instrument reality** — a reading is revealed only after the learner
   would actually have taken that measurement; don't reveal SG before the learner has chosen to weigh
   the stone.
4. **Property values verified** against `mineral-database`, `SPECTROSCOPE_REFERENCE`, or
   `wizard.ts`'s clue table, with a citation (Step 3 above).
5. **Treatment/final-identification steps carry `pointsMultiplier: 2`** (or higher, if justified) to
   reflect their higher stakes relative to earlier exploratory steps.
6. **Debrief teaches the procedure**, not just the answer — `expertPath` should read as a short "how
   an expert actually works this stone" sequence.

---

## Common Review Failures

### Failure 1 — Score doesn't match weight

```yaml
# Bad: acceptable weight but optimal-tier score, no allowScoreOverride
- id: reach-spectroscope
  weight: acceptable
  score: 10
```

The validator rejects this. Either fix the score to `5`, or add `allowScoreOverride: true` with a
comment explaining why this option deliberately deviates.

### Failure 2 — Evidence revealed before the corresponding test is chosen

```yaml
# Bad: SG appears in specimenSummary before any option lets the learner weigh the stone
specimenSummary: "A 2.10ct red stone, SG 4.00, ..."
```

Instrument readings belong in a step's `evidenceRevealed`, gated behind the option that represents
choosing that test.

### Failure 3 — candidatesAfter widens the field

```yaml
# Bad: step 2 narrowed to 1 candidate, step 3 lists 3 — the field cannot widen
# (step 2) candidatesAfter: [{familyId: corundum, ...}]
# (step 3) candidatesAfter: [{familyId: corundum}, {familyId: spinel}, {familyId: garnet}]
```

Once a candidate is excluded by valid evidence, it should not reappear in a later step's
`candidatesAfter` list.

### Failure 4 — Rationale restates the answer

```yaml
# Bad: does not explain the diagnostic reasoning
- text: "Red spinel"
  weight: poor
  score: 0
  rationale: "This is not correct."
```

Every option's rationale must identify which property or observation makes that option optimal,
acceptable, or poor — mirror `authoring-questions.md`'s "Failure 2" guidance.

### Failure 5 — Property value uncited or unverified

Any RI/SG/spectroscope/treatment claim without a matching `references` entry, or one that doesn't
match `mineral-db info <family-id>` / `SPECTROSCOPE_REFERENCE` / `wizard.ts`, should not ship with
`unvetted: false`.

---

## Cross-references

- Case schema (Zod): `src/content/config.ts` (`casesCollection`); `src/content/cases/_example/` for
  the template
- Runtime types and mapper: `src/lib/cases/case-types.ts`, `src/lib/cases/mapper.ts`
- Scoring model: `src/lib/cases/scoring.ts` (efficiency bonus, grade computation)
- Case runner hook: `src/hooks/useCaseRunner.ts`
- Components: `src/components/cases/` (`CaseIntro`, `CaseStepPanel`, `CaseOptionList`,
  `EvidenceNotebook`, `CaseProgressStrip`, `CaseDebrief`, `CaseRunner`)
- Routes: `src/pages/study/cases/[id].astro`; unified hub section at `src/pages/study/challenges/index.astro`
  ("Lab Cases")
- Sister guide for the question bank: [authoring-questions.md](authoring-questions.md)

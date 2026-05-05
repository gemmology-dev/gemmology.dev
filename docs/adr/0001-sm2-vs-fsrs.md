# ADR-0001: Adopt SM-2 for v1 Spaced Repetition, with FSRS Upgrade Path to v1.1

**Status:** Accepted
**Date:** 2026-05-05
**Author:** documentation-architect (T6), based on V1-PLAN.md §2 (A4) and REPORT.md §4 (P1.2)

---

## Context

The study system v1 adds spaced-repetition scheduling to the gemmology.dev quiz system. Every answered question needs a scheduling algorithm that decides when it should next appear in a session. Two algorithms are candidates:

**SM-2** (SuperMemo 2, 1987) is the algorithm used by Anki's classic scheduler. It maintains, per question, an ease factor (EF, default 2.5) and an interval in days. After each review, the interval is multiplied by the EF if the answer was successful (quality >= 3), or reset to 1 day on failure. EF adjusts up or down based on a quality scalar 0–5.

**FSRS** (Free Spaced Repetition Scheduler, 2022) is a more recent algorithm developed by Jarrett Ye. It models memory using a continuous forgetting curve and learns per-user parameters from response history. It is increasingly adopted in Anki as an optional replacement for the classic SM-2 scheduler.

The decision is bounded: either algorithm can be implemented as a pure module (`src/lib/quiz/scheduler.ts`) behind the `updateSchedule(entry, quality, now) → ScheduleEntry` signature. The `ScheduleEntry` type is shared regardless of which algorithm populates it. Swapping algorithms does not require component changes.

### Constraints

1. The system launches with zero historical response data. No per-user or per-item parameters can be learned at launch.
2. The engineering team is small. Debugging complexity of a scheduler bug costs real time.
3. The evidence base for spaced repetition in professional certification study is strong in aggregate but sparse for FSRS specifically in indexed, peer-reviewed literature.
4. The v1.0 acceptance timeline is 4–6 weeks (V1-PLAN.md §12). FSRS implementation is more complex than SM-2.

---

## Decision

**Adopt SM-2 for v1.0.**

The `scheduler.ts` module implements the classic SM-2 algorithm exactly as described in V1-PLAN.md §5.1. The quality-to-confidence mapping (V1-PLAN.md §A4) translates the three-level confidence tap (unsure / fairly sure / certain) crossed with correctness into a 0–5 integer quality score that SM-2 expects.

The `ScheduleEntry` type is designed to be algorithm-agnostic. The fields `intervalDays`, `easeFactor`, `repetitions`, `lapses`, `lastReviewed`, `nextDue`, and `totalReviews` are sufficient for SM-2 and are a superset of the data FSRS requires (FSRS uses stability and retrievability estimates rather than EF, but these can be derived from or stored alongside the existing fields in a migration).

The FSRS upgrade is scoped to v1.1 and is a drop-in module replacement.

---

## Consequences

### Accepted trade-offs of SM-2

**Overconfident on lapses.** When a question lapses after a long interval (e.g., 30 days), SM-2 collapses the interval immediately to 1 day. There is no smooth decay — the algorithm treats a forgotten card as if it were brand new. FSRS models the residual memory trace more accurately. In practice, for a question bank at the scale of v1.0 (50–150 curated items), this distinction is unlikely to be perceptible to users.

**Single quality scalar.** SM-2 receives a single integer 0–5. The richer signal available from the confidence tap (correct/incorrect × unsure/fairly-sure/certain × response time) is compressed into that integer. Information is discarded. FSRS can in principle accept a richer signal, though its public interface also uses a quality scalar in most implementations.

**No parameter learning.** SM-2 uses a fixed formula with constants. The ease factor adapts per-item based on individual review history, but the constants (EF minimum, adjustment coefficients) are the same for every user. FSRS learns optimal per-user parameters from population data. At v1.0 launch, there is no population data, so this is not a practical disadvantage — it becomes one only after significant response volume accumulates (roughly N > 200 responses per item for meaningful FSRS parameter fitting).

**Potential for interval stagnation on difficult items.** The EF minimum is clamped at 1.3. An item answered incorrectly repeatedly will have its EF driven toward 1.3 and its intervals will grow very slowly. This is correct behaviour — it keeps difficult items in frequent review — but SM-2 does not explicitly model the distinction between "genuinely difficult" and "badly written item." FSRS's stability model is somewhat better at this, but item analysis (flagging items with p-value < 0.20 and point-biserial r < 0.15) is the correct long-term fix and is planned for v1.1 (V1-PLAN.md §5.4).

### Positive consequences

SM-2 has been validated in medical education contexts (Kornell 2009, DOI: 10.1002/acp.1537; Mohamed 2025, PMID: 41798361). Its behaviour is well-understood, its edge cases (new card, lapsed card, first repetition, EF floor) are thoroughly documented, and the Anki community has decades of reported experience with its failure modes. This makes unit tests straightforward to write against known reference cases (V1-PLAN.md §9, `scheduler.test.ts`).

The simplicity of the implementation reduces the risk of subtle scheduling bugs that would be difficult to diagnose from user reports. If the scheduler produces an unexpected interval, the `ScheduleEntry` stored in `localStorage` is fully human-readable and debuggable in browser DevTools.

### FSRS upgrade path (v1.1)

The upgrade requires:

1. Replace `scheduler.ts` with an FSRS implementation (several TypeScript ports of the reference implementation exist).
2. Write a migration in `store/migrations.ts` that converts `ScheduleEntry.easeFactor` and `ScheduleEntry.intervalDays` into FSRS stability estimates. The conversion is lossy but acceptable for a one-time migration.
3. Update `ScheduleEntry` to include FSRS-specific fields (stability, difficulty, retrievability) alongside the existing SM-2 fields during the transition period.
4. No component changes required.

The decision to migrate should be triggered by: (a) a published RCT comparing SM-2 and FSRS in professional certification study appearing in an indexed database, or (b) user feedback indicating that interval growth feels wrong for a significant fraction of items.

---

## Alternatives Considered

### Alternative 1 — Leitner box system

A simpler algorithm using three to five physical "boxes" with fixed intervals (daily, every three days, weekly, monthly). Easier to explain to non-technical curators. Rejected because: the fixed intervals cannot adapt to individual item difficulty; the system cannot distinguish a lucky correct guess from secure recall; and the Leitner box adds no technical simplicity over SM-2 (both are O(1) per review update).

### Alternative 2 — FSRS from day one

Implement FSRS immediately. The argument is that it is strictly better than SM-2 and the switching cost grows over time as response data accumulates in SM-2 format. Rejected because: no indexed RCT comparing the two algorithms in a professional certification context has been located (REPORT.md §6, "FSRS vs SM-2 RCT: UNVERIFIED"); FSRS implementation and debugging is more complex; and the parameter-learning advantage of FSRS requires significant response volume (N > 200 per item) to materialise — volume that does not exist at v1.0 launch.

### Alternative 3 — No scheduler; weighted random selection

Simply weight question selection by the inverse of last-attempt accuracy (worse performance → higher selection probability). Easier to implement; no per-item state. Rejected because: it does not encode the time dimension (forgetting curve); a question answered perfectly two months ago is treated identically to one answered perfectly five minutes ago; and the evidence base for spaced repetition specifically (as opposed to any adaptive system) is strong enough to justify the additional complexity (spacing effect: 74% vs 57% retention, Kornell 2009).

---

## Evidence Summary

| Claim | Source | Confidence |
|-------|--------|------------|
| Spacing effect: 74% vs 57% retention | Kornell 2009 (DOI: 10.1002/acp.1537) | VERIFIED |
| SM-2 effective in medical education | Mohamed 2025 (PMID: 41798361) | PARTIALLY_SUPPORTED |
| No indexed RCT comparing FSRS vs SM-2 | Literature search, 2026-05-05 | VERIFIED (absence) |
| 3-option MCQ equivalent to 4-option | Sridharan 2025 (DOI: 10.1186/s12909-025-08026-5) | VERIFIED |

Full citation registry: REPORT.md §6.

---

## Related Documents

- [docs/study-system.md](../study-system.md) — SM-2 mechanics, worked example, known weaknesses
- V1-PLAN.md §2 (A4) — architectural decision rationale (primary source)
- V1-PLAN.md §5.1 — `updateSchedule` implementation reference
- REPORT.md §4 (P1.2) — pedagogical evidence for spaced repetition

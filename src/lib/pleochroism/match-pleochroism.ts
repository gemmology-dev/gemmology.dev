/**
 * Pure matcher used by the Pleochroism Reasoner widget.
 *
 * Given the number of distinct colours the user observed in the dichroscope
 * (1, 2, or 3), the colours themselves, and an optional perceived strength,
 * rank candidate gem species in the database by how well they fit.
 *
 * The "number of colours" carries a strong gemmological signal:
 *   1 → isotropic (cubic / amorphous) OR observed only along the optic axis
 *   2 → dichroic, i.e. uniaxial (trigonal / tetragonal / hexagonal)
 *   3 → trichroic, i.e. biaxial (orthorhombic / monoclinic / triclinic)
 */

import type { Mineral } from '../db';

export type ObservedColourCount = 1 | 2 | 3;

export type PleochroismStrength =
  | 'unknown'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very_strong';

export interface PleochroismCriteria {
  /** How many distinct colours the user saw through the dichroscope. */
  colourCount: ObservedColourCount;
  /** Up to three observed colour names, lowercase / trimmed. */
  colours: string[];
  /** Optional perceived strength. */
  strength: PleochroismStrength;
}

export interface PleochroismMatch {
  mineral: Mineral;
  /** 0..1 — how well the gem fits the reported observation. */
  score: number;
  /** Human-friendly reason text used in the UI. */
  reason: string;
  /** Number of distinct colours stored in the DB for this gem (1, 2 or 3). */
  storedColourCount: 1 | 2 | 3;
}

const STRENGTH_RANK: Record<string, number> = {
  none: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
  very_strong: 4,
};

/** Normalise a colour string for fuzzy comparison. */
function normaliseColour(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s\-_/]+/g, ' ')
    .replace(/\bish\b/g, '')
    .replace(/\s+/g, ' ');
}

/** Tokenise a colour name into bare colour words: "yellowish-green" → ["yellow","green"]. */
function colourTokens(s: string): string[] {
  const root = normaliseColour(s)
    .replace(/(?:bluish|greenish|yellowish|reddish|pinkish|orangish|brownish|purplish|violetish)/g, (m) =>
      m.replace(/ish$/, ''),
    );
  return root.split(' ').filter(Boolean);
}

/**
 * Compare one observed colour to one stored colour.
 * Returns 1.0 for exact / strong overlap, 0.5 for partial token overlap, 0 otherwise.
 */
function colourSimilarity(observed: string, stored: string | undefined | null): number {
  if (!stored) return 0;
  const a = normaliseColour(observed);
  const b = normaliseColour(stored);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const ta = new Set(colourTokens(a));
  const tb = new Set(colourTokens(b));
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared++;
  });
  if (shared === 0) return 0;
  const denom = Math.max(ta.size, tb.size);
  return Math.min(0.6, shared / denom);
}

/**
 * Score the match between observed colours and the gem's stored 2-3 colours.
 * Uses greedy assignment: each observed colour pairs with its best remaining stored colour.
 */
function colourSetSimilarity(observed: string[], stored: (string | undefined | null)[]): number {
  const cleanStored = stored.filter((s): s is string => Boolean(s && s.trim()));
  if (observed.length === 0 || cleanStored.length === 0) return 0;

  const remaining = [...cleanStored];
  let total = 0;
  for (const obs of observed) {
    let bestIdx = -1;
    let bestSim = 0;
    remaining.forEach((s, i) => {
      const sim = colourSimilarity(obs, s);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) {
      total += bestSim;
      remaining.splice(bestIdx, 1);
    }
  }
  return total / observed.length;
}

function storedColourCountOf(m: Mineral): 1 | 2 | 3 | 0 {
  if (m.pleochroism_color3 && m.pleochroism_color3.trim()) return 3;
  if (m.pleochroism_color2 && m.pleochroism_color2.trim()) return 2;
  if (m.pleochroism_color1 && m.pleochroism_color1.trim()) return 1;
  return 0;
}

/**
 * Match observed pleochroism against the mineral database.
 *
 * @param criteria  what the user observed
 * @param minerals  mineral list (already loaded by the caller, e.g. via getAllMinerals)
 * @returns matches ranked by score, descending, capped at 50
 */
export function matchPleochroism(
  criteria: PleochroismCriteria,
  minerals: Mineral[],
): PleochroismMatch[] {
  const observedColours = criteria.colours
    .map((c) => c.trim())
    .filter(Boolean);

  const matches: PleochroismMatch[] = [];

  for (const mineral of minerals) {
    const storedCount = storedColourCountOf(mineral);
    if (storedCount === 0) continue;

    // Step 1 — colour-count match.
    // 1 observed: ANY pleochroic gem could read as 1 if viewed along optic axis;
    //   so we don't penalise but we DO prefer exact-count matches.
    // 2 observed: dichroic or trichroic-viewed-from-side; dichroic gems score higher.
    // 3 observed: only trichroic gems (storedCount === 3).
    let countScore: number;
    if (criteria.colourCount === storedCount) {
      countScore = 1.0;
    } else if (criteria.colourCount === 3 && storedCount < 3) {
      // Three observed colours but DB knows only 2 → impossible match.
      continue;
    } else if (criteria.colourCount === 2 && storedCount === 3) {
      // Possible if viewed off the optic-plane bisector — partial credit.
      countScore = 0.6;
    } else if (criteria.colourCount === 1) {
      // Saw one colour — could be any gem viewed favourably; mild penalty for richer ones.
      countScore = storedCount === 1 ? 1.0 : 0.4;
    } else {
      countScore = 0.3;
    }

    // Step 2 — colour similarity.
    const stored = [
      mineral.pleochroism_color1,
      mineral.pleochroism_color2,
      mineral.pleochroism_color3,
    ];
    const colourScore =
      observedColours.length === 0 ? 1 : colourSetSimilarity(observedColours, stored);

    // Step 3 — strength similarity (optional).
    let strengthScore = 1;
    if (criteria.strength !== 'unknown' && mineral.pleochroism_strength) {
      const obsRank = STRENGTH_RANK[criteria.strength] ?? 2;
      const dbRank = STRENGTH_RANK[mineral.pleochroism_strength] ?? 2;
      const diff = Math.abs(obsRank - dbRank);
      strengthScore = Math.max(0, 1 - diff * 0.25);
    }

    // Weighted overall score: colour overlap matters most, count next, strength last.
    const score = colourScore * 0.6 + countScore * 0.3 + strengthScore * 0.1;
    if (score < 0.2) continue;

    const reasonParts: string[] = [];
    reasonParts.push(
      storedCount === 3
        ? 'Trichroic: biaxial (orthorhombic, monoclinic, or triclinic).'
        : storedCount === 2
          ? 'Dichroic: uniaxial (trigonal, tetragonal, or hexagonal).'
          : 'Single observed colour: pleochroism not detectable.',
    );
    if (mineral.pleochroism_strength) {
      reasonParts.push(
        `Strength: ${mineral.pleochroism_strength.replace('_', ' ')}.`,
      );
    }
    if (mineral.pleochroism_notes) {
      reasonParts.push(mineral.pleochroism_notes);
    }

    matches.push({
      mineral,
      score,
      reason: reasonParts.join(' '),
      storedColourCount: storedCount as 1 | 2 | 3,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 50);
}

/**
 * Educational interpretation of the colour count itself, independent of any match.
 * Used in the UI as a "what your observation implies" callout.
 */
export function interpretColourCount(count: ObservedColourCount): {
  title: string;
  body: string;
} {
  switch (count) {
    case 1:
      return {
        title: 'One colour observed',
        body:
          'The gem may be isotropic (cubic or amorphous: diamond, garnet, spinel, glass, opal), or anisotropic but viewed along its optic axis. Rotate the dichroscope and the stone; if no second colour appears at any orientation, isotropic is most likely.',
      };
    case 2:
      return {
        title: 'Two colours observed (dichroic)',
        body:
          'The gem is uniaxial: trigonal, tetragonal, or hexagonal. Examples include corundum (ruby/sapphire), tourmaline, beryl (emerald/aquamarine), zircon, and quartz.',
      };
    case 3:
      return {
        title: 'Three colours observed (trichroic)',
        body:
          'The gem is biaxial: orthorhombic, monoclinic, or triclinic. Examples include andalusite, iolite, tanzanite, kunzite, topaz, and peridot.',
      };
  }
}

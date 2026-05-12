/**
 * Hanneman / Hodgkinson short-cut method for over-the-limit (OTL) RI estimation.
 *
 * When a gem's refractive index lies above the standard refractometer scale
 * (~1.81), gemmologists use a "contact-liquid comparison" technique:
 *
 *   1. Place the polished stone on a flat surface in a drop of a known liquid.
 *   2. View the stone from the side, illuminated from behind/below.
 *   3. Estimate whether the stone's RI is LOWER, EQUAL, or HIGHER than the
 *      liquid by relief, surface visibility, and edge contrast.
 *
 * Each liquid has a known RI; comparing the stone to several liquids brackets
 * the stone's RI band. This file encodes the standard liquid ladder used in
 * gemmological practice and a pure helper that turns observations into an
 * RI band + candidate-mineral filter.
 */

import type { Mineral } from '../db';

export interface ContactLiquid {
  id: string;
  name: string;
  ri: number;
  /** Short note shown in the picker UI. */
  note?: string;
}

/**
 * Standard contact-liquid ladder, ordered from lowest RI to highest.
 * Sources: Hodgkinson (Visual Optics), Hanneman (Affordable Gemology).
 */
export const CONTACT_LIQUIDS: ContactLiquid[] = [
  { id: 'water', name: 'Water', ri: 1.33, note: 'Reference; most gems show high relief.' },
  { id: 'cedar-oil', name: 'Cedarwood oil', ri: 1.515, note: 'Common microscope mounting oil.' },
  { id: 'mono-bromo', name: 'Monobromonaphthalene', ri: 1.66, note: 'Classic bracketing fluid.' },
  { id: 'methylene-iodide', name: 'Methylene iodide (di-iodomethane)', ri: 1.74, note: 'Standard refractometer contact fluid.' },
  { id: 'methylene-iodide-s', name: 'Methylene iodide + sulphur (saturated)', ri: 1.78, note: 'Pushes RI ceiling for high-RI gems.' },
  { id: 'methylene-iodide-si', name: 'Methylene iodide + sulphur + Sel d\'Iode', ri: 1.81, note: 'Standard upper limit of refractometer fluid.' },
];

export type Relief = 'lower' | 'equal' | 'higher' | 'unknown';

export interface HannemanCriteria {
  /** Liquid id from CONTACT_LIQUIDS. */
  liquidId: string;
  /** Whether the stone reads as lower-RI, equal, or higher-RI than the liquid. */
  relief: Relief;
}

export interface RIBand {
  /** Lower bound of inferred RI (inclusive). */
  min: number;
  /** Upper bound of inferred RI (inclusive). */
  max: number;
  /** Human-friendly explanation. */
  rationale: string;
}

/**
 * Convert a single liquid+relief observation to an inferred RI band.
 *
 * The width of the band reflects honest uncertainty: side-by-side relief
 * judgements are good to about ±0.05 RI in skilled hands.
 */
export function inferRIBand(criteria: HannemanCriteria): RIBand | null {
  const liquid = CONTACT_LIQUIDS.find((l) => l.id === criteria.liquidId);
  if (!liquid) return null;

  const margin = 0.05;
  switch (criteria.relief) {
    case 'lower':
      return {
        min: 1.0,
        max: Math.max(1.0, liquid.ri - 0.02),
        rationale: `Stone shows lower relief than ${liquid.name} (RI ${liquid.ri.toFixed(3)}), so its RI is below ${liquid.ri.toFixed(3)}.`,
      };
    case 'equal':
      return {
        min: Math.max(1.0, liquid.ri - margin),
        max: liquid.ri + margin,
        rationale: `Stone disappears or matches ${liquid.name} (RI ${liquid.ri.toFixed(3)}), so its RI is within ±${margin.toFixed(2)}.`,
      };
    case 'higher':
      return {
        min: liquid.ri + 0.02,
        max: 3.0,
        rationale: `Stone shows higher relief than ${liquid.name} (RI ${liquid.ri.toFixed(3)}), so its RI is above ${liquid.ri.toFixed(3)}.`,
      };
    default:
      return null;
  }
}

/**
 * Combine multiple liquid+relief observations into the tightest consistent band.
 * Each observation narrows the band; if they conflict, the intersection is empty
 * and we return `null`.
 */
export function combineBands(observations: HannemanCriteria[]): RIBand | null {
  const bands = observations
    .map(inferRIBand)
    .filter((b): b is RIBand => b !== null);
  if (bands.length === 0) return null;

  let lo = -Infinity;
  let hi = Infinity;
  const reasons: string[] = [];
  for (const band of bands) {
    lo = Math.max(lo, band.min);
    hi = Math.min(hi, band.max);
    reasons.push(band.rationale);
  }
  if (lo > hi) {
    return {
      min: lo,
      max: hi,
      rationale: `Conflicting observations. Please re-test. ${reasons.join(' ')}`,
    };
  }
  return {
    min: Math.max(1.0, lo),
    max: Math.min(3.0, hi),
    rationale: reasons.join(' '),
  };
}

export interface HannemanMatch {
  mineral: Mineral;
  /** True when the stored RI range overlaps the inferred band. */
  overlap: boolean;
  /** Centre RI of the stored range (for sorting). */
  storedCentre: number;
}

/**
 * Filter the mineral database to species whose RI range intersects the
 * inferred band. Sorted by closest match centre.
 */
export function filterMineralsByBand(band: RIBand, minerals: Mineral[]): HannemanMatch[] {
  const bandCentre = (band.min + band.max) / 2;
  const matches: HannemanMatch[] = [];

  for (const m of minerals) {
    if (m.ri_min === undefined || m.ri_max === undefined) continue;
    const overlap = m.ri_min <= band.max && m.ri_max >= band.min;
    if (!overlap) continue;
    const centre = (m.ri_min + m.ri_max) / 2;
    matches.push({ mineral: m, overlap: true, storedCentre: centre });
  }

  matches.sort(
    (a, b) => Math.abs(a.storedCentre - bandCentre) - Math.abs(b.storedCentre - bandCentre),
  );
  return matches;
}

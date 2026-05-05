/**
 * Pure matcher for the Spectroscope Band Matcher widget.
 *
 * Inputs: a set of observed band wavelengths (the user ticks them off in the
 * UI) plus an optional tolerance in nm. For each species in the reference
 * table, we count how many bands match, weighted by intensity and
 * "selective" flag, and divide by the species' total band weight to get a
 * coverage score. The result is a ranked candidate list.
 */

import {
  SPECTROSCOPE_REFERENCE,
  type AbsorptionBand,
  type SpectroscopeReference,
} from './reference-bands';

const INTENSITY_WEIGHT = { weak: 1, moderate: 2, strong: 3 } as const;

export interface BandMatch {
  reference: SpectroscopeReference;
  /** 0..1 — fraction of the species' weighted bands the user observed. */
  coverage: number;
  /** Bands that matched (with the observed wavelength that triggered them). */
  matched: { observed: number; band: AbsorptionBand }[];
  /** True if at least one matched band was flagged `selective`. */
  hasSelective: boolean;
  /** Reasoning text for the UI. */
  reason: string;
}

function bandWavelengths(b: AbsorptionBand): number[] {
  return [b.wavelength, ...(b.also ?? [])];
}

function nearest(observed: number, target: number): number {
  return Math.abs(observed - target);
}

/**
 * Match observed bands against the reference table.
 * @param observed   list of wavelengths the user ticked
 * @param tolerance  ± nm window for considering a band "matched" (default 5 nm)
 */
export function matchBands(observed: number[], tolerance = 5): BandMatch[] {
  if (observed.length === 0) return [];

  const out: BandMatch[] = [];
  for (const reference of SPECTROSCOPE_REFERENCE) {
    let totalWeight = 0;
    let matchedWeight = 0;
    let hasSelective = false;
    const matched: BandMatch['matched'] = [];

    for (const band of reference.bands) {
      const w = INTENSITY_WEIGHT[band.intensity] * (band.selective ? 2 : 1);
      totalWeight += w;

      const targets = bandWavelengths(band);
      let bestObs: number | null = null;
      let bestDist = Infinity;
      for (const obs of observed) {
        for (const target of targets) {
          const d = nearest(obs, target);
          if (d <= tolerance && d < bestDist) {
            bestDist = d;
            bestObs = obs;
          }
        }
      }
      if (bestObs !== null) {
        matchedWeight += w;
        matched.push({ observed: bestObs, band });
        if (band.selective) hasSelective = true;
      }
    }

    if (matchedWeight === 0) continue;
    const coverage = matchedWeight / totalWeight;

    const reasonParts: string[] = [];
    reasonParts.push(`${matched.length} of ${reference.bands.length} reference bands matched.`);
    if (hasSelective) {
      reasonParts.push('Includes a selective (diagnostic) band.');
    }
    if (reference.observationNotes) {
      reasonParts.push(reference.observationNotes);
    }

    out.push({
      reference,
      coverage,
      matched,
      hasSelective,
      reason: reasonParts.join(' '),
    });
  }

  out.sort((a, b) => {
    // Selective matches dominate.
    if (a.hasSelective !== b.hasSelective) return a.hasSelective ? -1 : 1;
    return b.coverage - a.coverage;
  });
  return out;
}

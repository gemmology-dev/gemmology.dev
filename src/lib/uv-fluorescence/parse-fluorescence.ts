/**
 * UV-fluorescence parser.
 *
 * The mineral database stores fluorescence as a freeform text field
 * ("LWUV: red strong; SWUV: weak red; phosphoresces"). To support a UV
 * lookup widget without a SQL schema migration, we parse that string into
 * structured `{lwuv, swuv, phosphorescence}` triples, then match against
 * user-reported observations.
 *
 * The parser is forgiving — it handles many trade abbreviations (LW/SW,
 * 365 nm/254 nm, "long-wave", "short-wave") and conservatively returns
 * `undefined` per field when uncertain.
 */

export type UvIntensity = 'inert' | 'weak' | 'moderate' | 'strong' | 'very_strong' | 'unknown';

export interface UvFluorescence {
  lwuv?: { color?: string; intensity: UvIntensity };
  swuv?: { color?: string; intensity: UvIntensity };
  phosphorescence?: string;
}

const INTENSITY_RE = /\b(inert|none|weak|moderate|medium|strong|very[\s-]?strong|intense)\b/i;

const COLOR_RE =
  /\b(red(?:dish)?|orange|yellow(?:ish)?|green(?:ish)?|blue(?:ish)?|violet|purple|pink|white|chalky|cream|salmon|brown(?:ish)?)\b/i;

function intensityFrom(s: string): UvIntensity {
  const m = s.match(INTENSITY_RE);
  if (!m) return 'unknown';
  const w = m[1].toLowerCase().replace(/[\s-]/g, '');
  if (w === 'inert' || w === 'none') return 'inert';
  if (w === 'weak') return 'weak';
  if (w === 'moderate' || w === 'medium') return 'moderate';
  if (w === 'verystrong' || w === 'intense') return 'very_strong';
  if (w === 'strong') return 'strong';
  return 'unknown';
}

function colorFrom(s: string): string | undefined {
  const m = s.match(COLOR_RE);
  return m ? m[0].toLowerCase() : undefined;
}

/**
 * Parse a freeform fluorescence text into structured fields.
 * Examples handled:
 *   "LW: red strong; SW: inert"
 *   "Long-wave UV strong red, short-wave weak"
 *   "365 nm: red moderate; 254 nm: chalky white weak"
 *   "Inert"
 */
export function parseFluorescence(text: string | null | undefined): UvFluorescence | null {
  if (!text || !text.trim()) return null;
  const t = text.toLowerCase();

  if (/\b(inert|none)\b/i.test(t) && !/\b(lw|sw|long|short|365|254)\b/i.test(t)) {
    return { lwuv: { intensity: 'inert' }, swuv: { intensity: 'inert' } };
  }

  // Split on common separators that signal LW vs SW segments.
  const segments = t
    .split(/[;.\n]|(?:,| and )\s*(?=(?:lw|sw|long|short|365|254))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  let lwuv: UvFluorescence['lwuv'];
  let swuv: UvFluorescence['swuv'];
  let phosphorescence: string | undefined;

  for (const seg of segments) {
    if (/phosphoresc/.test(seg)) phosphorescence = seg.trim();

    const isLW = /\b(lw|long[-\s]?wave|365)/.test(seg);
    const isSW = /\b(sw|short[-\s]?wave|254)/.test(seg);
    const intensity = intensityFrom(seg);
    const color = colorFrom(seg);

    if (isLW && intensity !== 'unknown') lwuv = { intensity, color };
    if (isSW && intensity !== 'unknown') swuv = { intensity, color };
    // Untagged segment with both intensity+color: assume LW (the trade default).
    if (!isLW && !isSW && intensity !== 'unknown' && !lwuv) {
      lwuv = { intensity, color };
    }
  }

  if (!lwuv && !swuv && !phosphorescence) return null;
  return { lwuv, swuv, phosphorescence };
}

export interface UvObservation {
  lwuvIntensity: UvIntensity;
  lwuvColor: string;
  swuvIntensity: UvIntensity;
  swuvColor: string;
}

/**
 * Score how well a mineral's parsed fluorescence matches an observation.
 * Returns 0..1; values below 0.25 are filtered out by callers.
 */
export function scoreUvMatch(obs: UvObservation, fl: UvFluorescence | null): number {
  if (!fl) return 0;
  let score = 0;
  let weight = 0;

  const cmpField = (
    obsIntensity: UvIntensity,
    obsColor: string,
    field: { intensity: UvIntensity; color?: string } | undefined,
  ) => {
    if (obsIntensity === 'unknown') return;
    weight += 1;
    if (!field) return;
    // Intensity similarity (rank distance).
    const rank: Record<UvIntensity, number> = {
      inert: 0,
      weak: 1,
      moderate: 2,
      strong: 3,
      very_strong: 4,
      unknown: 2,
    };
    const intensityDiff = Math.abs(rank[obsIntensity] - rank[field.intensity]);
    const intensityScore = Math.max(0, 1 - intensityDiff * 0.25);
    let colorScore = 0.5;
    if (obsColor && field.color) {
      colorScore = obsColor.toLowerCase() === field.color.toLowerCase() ? 1 : 0;
    } else if (!obsColor) {
      colorScore = 1;
    }
    score += 0.4 * intensityScore + 0.6 * colorScore;
  };

  cmpField(obs.lwuvIntensity, obs.lwuvColor, fl.lwuv);
  cmpField(obs.swuvIntensity, obs.swuvColor, fl.swuv);

  if (weight === 0) return 0;
  return score / weight;
}

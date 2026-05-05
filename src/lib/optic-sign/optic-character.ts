/**
 * Optic-character + 2V reasoner.
 *
 * Inputs from the user:
 *   - Optic character observed in the polariscope (isotropic / uniaxial / biaxial / aggregate).
 *   - For uniaxial: ω and ε refractive indices.
 *   - For biaxial: α, β, γ refractive indices (β optional — derived if missing).
 *
 * Outputs:
 *   - Computed optic sign and birefringence.
 *   - 2V band for biaxial gems (Mallard formula approximation).
 *   - Ranked candidate species filtered against the database, parsing the
 *     `optical_character` text field for each family.
 *
 * The mineral database stores `optical_character` as freeform text — see
 * MineralFamily.optical_character. Values seen in the source YAML include:
 * "Isotropic", "Uniaxial +", "Uniaxial -", "Uniaxial - (occasionally +)",
 * "Biaxial +", "Biaxial -", "Biaxial + or -", "AGG", "Aggregate",
 * "Isotropic to near-isotropic (AGG)", "Opaque (metallic)".
 *
 * This pure-TS layer parses that text into a discriminated `OpticalCharacter`
 * so we don't need to touch the SQLite schema for v1.
 */

export type OpticCharacterKind =
  | 'isotropic'
  | 'uniaxial'
  | 'biaxial'
  | 'aggregate'
  | 'opaque'
  | 'unknown';

export type OpticSign = '+' | '-' | '+/-' | 'n/a';

export interface OpticalCharacter {
  kind: OpticCharacterKind;
  sign: OpticSign;
  /** Original raw text from the database. */
  raw?: string;
}

/**
 * Parse the freeform `optical_character` field into a discriminated record.
 *
 * Heuristic rules (case-insensitive):
 *   - Contains "isotropic" → kind isotropic, sign n/a.
 *   - Contains "uniaxial" → kind uniaxial. Sign from "+ or -" / "+" / "-".
 *   - Contains "biaxial" → kind biaxial. Sign from "+ or -" / "+" / "-".
 *   - Contains "aggregate" / "AGG" → kind aggregate.
 *   - Contains "opaque" → kind opaque.
 *   - Otherwise unknown.
 */
export function parseOpticalCharacter(text: string | undefined | null): OpticalCharacter {
  if (!text || !text.trim()) return { kind: 'unknown', sign: 'n/a' };
  const raw = text.trim();
  const lower = raw.toLowerCase();

  let sign: OpticSign = 'n/a';
  if (/[+\-] *or *[+\-]|both signs|\+\/-/.test(lower)) sign = '+/-';
  else if (/(?:^|[^a-z])(uniaxial|biaxial)\s*\+/.test(lower)) sign = '+';
  else if (/(?:^|[^a-z])(uniaxial|biaxial)\s*-/.test(lower)) sign = '-';

  if (lower.includes('isotropic')) return { kind: 'isotropic', sign: 'n/a', raw };
  if (lower.includes('uniaxial')) return { kind: 'uniaxial', sign, raw };
  if (lower.includes('biaxial')) return { kind: 'biaxial', sign, raw };
  if (lower.includes('aggregate') || /\bagg\b/.test(lower)) {
    return { kind: 'aggregate', sign: 'n/a', raw };
  }
  if (lower.includes('opaque')) return { kind: 'opaque', sign: 'n/a', raw };
  return { kind: 'unknown', sign: 'n/a', raw };
}

/**
 * Determine optic sign from uniaxial RI readings.
 * Uniaxial positive: ε > ω (epsilon, the extraordinary ray, is larger).
 * Uniaxial negative: ε < ω.
 */
export function uniaxialSign(omega: number, epsilon: number): OpticSign {
  const diff = epsilon - omega;
  if (Math.abs(diff) < 0.001) return 'n/a';
  return diff > 0 ? '+' : '-';
}

/**
 * Determine optic sign from biaxial RI readings.
 * Biaxial positive: γ - β  >  β - α (β closer to α).
 * Biaxial negative: γ - β  <  β - α (β closer to γ).
 */
export function biaxialSign(alpha: number, beta: number, gamma: number): OpticSign {
  if (alpha > gamma) {
    // Caller swapped them; fix.
    [alpha, gamma] = [gamma, alpha];
  }
  const upper = gamma - beta;
  const lower = beta - alpha;
  if (Math.abs(upper - lower) < 0.0005) return '+/-';
  return upper > lower ? '+' : '-';
}

/**
 * Approximate 2V using the Mallard formula:
 *   cos²(V_z) = (γ² · (β² - α²)) / (β² · (γ² - α²))
 *
 * Returns Vz in degrees (the optic axial angle measured from γ for biaxial+
 * or from α for biaxial-). Caller decides which axis the angle refers to.
 *
 * Returns null if the inputs are degenerate.
 */
export function biaxial2V(alpha: number, beta: number, gamma: number): number | null {
  if (alpha > gamma) [alpha, gamma] = [gamma, alpha];
  if (gamma <= alpha || beta <= alpha || beta >= gamma) return null;
  const num = gamma * gamma * (beta * beta - alpha * alpha);
  const den = beta * beta * (gamma * gamma - alpha * alpha);
  if (den === 0) return null;
  const cosSq = num / den;
  if (cosSq < 0 || cosSq > 1) return null;
  const vz = Math.acos(Math.sqrt(cosSq)) * (180 / Math.PI);
  return vz;
}

/**
 * Compatibility check between an observed character and a parsed reference.
 * Returns true if the species is compatible with the user's observation.
 */
export function characterMatches(
  observedKind: OpticCharacterKind,
  observedSign: OpticSign | undefined,
  reference: OpticalCharacter,
): boolean {
  if (reference.kind === 'unknown') return false;
  // Aggregate often masks other characters — keep flexible.
  if (observedKind === 'aggregate') return reference.kind === 'aggregate';
  if (reference.kind === 'aggregate') return false;
  if (reference.kind !== observedKind) return false;
  if (!observedSign || observedSign === 'n/a' || reference.sign === 'n/a') return true;
  if (reference.sign === '+/-' || observedSign === '+/-') return true;
  return reference.sign === observedSign;
}

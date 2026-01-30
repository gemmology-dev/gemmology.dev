/**
 * Confidence scoring logic for gem identification.
 * Calculates match confidence based on multiple gemmological properties.
 */

import type { Mineral } from '../db';

/**
 * Input criteria for gem identification.
 */
export interface IdentificationCriteria {
  /** Single RI value (for isotropic or quick search) */
  ri?: number;
  /** Measured RI minimum (for anisotropic gems) */
  riMin?: number;
  /** Measured RI maximum (for anisotropic gems) */
  riMax?: number;
  sg?: number;
  birefringence?: number;
  dispersion?: number;
  hardness?: number;
  crystalSystem?: string;
  opticSign?: '+' | '-';
  /** Optic character filter */
  opticCharacter?: 'isotropic' | 'uniaxial' | 'biaxial';
}

/**
 * Tolerance settings for each property.
 */
export interface ToleranceSettings {
  ri: number;           // Default: 0.01
  sg: number;           // Default: 0.05
  birefringence: number; // Default: 0.005
  dispersion: number;   // Default: 0.003
  hardness: number;     // Default: 0.5
}

/**
 * Details about how a property matched.
 */
export interface PropertyMatch {
  property: string;
  measured: number | string;
  expected: string;
  deviation?: number;
  matched: boolean;
}

/**
 * Result of matching a mineral against criteria.
 */
export interface MatchResult {
  mineral: Mineral;
  matchedProperties: string[];
  confidenceScore: number;  // 0-100
  matchDetails: PropertyMatch[];
  totalWeight: number;
  matchedWeight: number;
}

/**
 * Property weights for confidence scoring.
 * Higher values indicate more diagnostic importance.
 */
export const PROPERTY_WEIGHTS: Record<string, number> = {
  ri: 25,
  riMin: 15,
  riMax: 15,
  sg: 20,
  birefringence: 15,
  hardness: 15,
  dispersion: 10,
  crystalSystem: 10,
  opticSign: 5,
  opticCharacter: 5,
};

/**
 * Default tolerance values.
 */
export const DEFAULT_TOLERANCES: ToleranceSettings = {
  ri: 0.01,
  sg: 0.05,
  birefringence: 0.005,
  dispersion: 0.003,
  hardness: 0.5,
};

/**
 * Parse a hardness string (e.g., "7-7.5" or "7") into min/max values.
 */
function parseHardness(hardness: string): [number, number] | null {
  if (!hardness) return null;

  // Handle ranges like "7-7.5" or "7 - 7.5"
  const rangeMatch = hardness.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
  }

  // Handle single values like "7" or "7.5"
  const singleMatch = hardness.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    return [value, value];
  }

  return null;
}

/**
 * Parse an optical character string to extract optic sign.
 */
function parseOpticSign(opticalCharacter: string | undefined): '+' | '-' | null {
  if (!opticalCharacter) return null;

  const lower = opticalCharacter.toLowerCase();
  if (lower.includes('positive') || lower.includes('+')) return '+';
  if (lower.includes('negative') || lower.includes('-')) return '-';
  return null;
}

/**
 * Check if a measured value falls within a mineral's range with tolerance.
 * Handles cases where only min or max is defined.
 * Uses == null to catch both null and undefined (SQLite returns null).
 */
function isInRange(
  measured: number,
  min: number | undefined | null,
  max: number | undefined | null,
  tolerance: number
): boolean {
  // If both are null/undefined, no data to match against
  if (min == null && max == null) return false;

  // If only min is defined, treat it as a single value (min = max)
  const effectiveMin = min ?? max!;
  const effectiveMax = max ?? min!;

  return measured >= effectiveMin - tolerance && measured <= effectiveMax + tolerance;
}

/**
 * Calculate the deviation from the center of a range.
 */
function calculateDeviation(
  measured: number,
  min: number,
  max: number
): number {
  const center = (min + max) / 2;
  return Math.abs(measured - center);
}

/**
 * Format a numeric range for display.
 * Uses == null to catch both null and undefined (SQLite returns null).
 */
function formatRange(min: number | undefined | null, max: number | undefined | null, decimals: number = 2): string {
  if (min == null || max == null) return 'N/A';
  if (min === max) return min.toFixed(decimals);
  return `${min.toFixed(decimals)}-${max.toFixed(decimals)}`;
}

/**
 * Calculate match result for a single mineral.
 */
export function calculateMatch(
  mineral: Mineral,
  criteria: IdentificationCriteria,
  tolerances: ToleranceSettings = DEFAULT_TOLERANCES
): MatchResult {
  const matchDetails: PropertyMatch[] = [];
  const matchedProperties: string[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  // RI matching - supports both single RI and riMin/riMax modes
  if (criteria.ri !== undefined) {
    // Single RI mode (isotropic or quick search)
    totalWeight += PROPERTY_WEIGHTS.ri;
    const matched = isInRange(criteria.ri, mineral.ri_min, mineral.ri_max, tolerances.ri);

    matchDetails.push({
      property: 'Refractive Index',
      measured: criteria.ri.toFixed(3),
      expected: formatRange(mineral.ri_min, mineral.ri_max, 3),
      deviation: mineral.ri_min != null && mineral.ri_max != null
        ? calculateDeviation(criteria.ri, mineral.ri_min, mineral.ri_max)
        : undefined,
      matched,
    });

    if (matched) {
      matchedProperties.push('ri');
      matchedWeight += PROPERTY_WEIGHTS.ri;
    }
  } else if (criteria.riMin !== undefined || criteria.riMax !== undefined) {
    // Dual RI mode (uniaxial/biaxial)
    // Check if measured RI range overlaps with mineral's RI range
    if (criteria.riMin !== undefined) {
      totalWeight += PROPERTY_WEIGHTS.riMin;
      const matched = isInRange(criteria.riMin, mineral.ri_min, mineral.ri_max, tolerances.ri);

      matchDetails.push({
        property: 'RI Minimum',
        measured: criteria.riMin.toFixed(3),
        expected: formatRange(mineral.ri_min, mineral.ri_max, 3),
        deviation: mineral.ri_min != null
          ? Math.abs(criteria.riMin - mineral.ri_min)
          : undefined,
        matched,
      });

      if (matched) {
        matchedProperties.push('riMin');
        matchedWeight += PROPERTY_WEIGHTS.riMin;
      }
    }

    if (criteria.riMax !== undefined) {
      totalWeight += PROPERTY_WEIGHTS.riMax;
      const matched = isInRange(criteria.riMax, mineral.ri_min, mineral.ri_max, tolerances.ri);

      matchDetails.push({
        property: 'RI Maximum',
        measured: criteria.riMax.toFixed(3),
        expected: formatRange(mineral.ri_min, mineral.ri_max, 3),
        deviation: mineral.ri_max != null
          ? Math.abs(criteria.riMax - mineral.ri_max)
          : undefined,
        matched,
      });

      if (matched) {
        matchedProperties.push('riMax');
        matchedWeight += PROPERTY_WEIGHTS.riMax;
      }
    }
  }

  // SG matching
  if (criteria.sg !== undefined) {
    totalWeight += PROPERTY_WEIGHTS.sg;
    const matched = isInRange(criteria.sg, mineral.sg_min, mineral.sg_max, tolerances.sg);

    matchDetails.push({
      property: 'Specific Gravity',
      measured: criteria.sg.toFixed(2),
      expected: formatRange(mineral.sg_min, mineral.sg_max, 2),
      deviation: mineral.sg_min != null && mineral.sg_max != null
        ? calculateDeviation(criteria.sg, mineral.sg_min, mineral.sg_max)
        : undefined,
      matched,
    });

    if (matched) {
      matchedProperties.push('sg');
      matchedWeight += PROPERTY_WEIGHTS.sg;
    }
  }

  // Birefringence matching
  if (criteria.birefringence !== undefined && mineral.birefringence != null) {
    totalWeight += PROPERTY_WEIGHTS.birefringence;
    const diff = Math.abs(criteria.birefringence - mineral.birefringence);
    const matched = diff <= tolerances.birefringence;

    matchDetails.push({
      property: 'Birefringence',
      measured: criteria.birefringence.toFixed(3),
      expected: mineral.birefringence.toFixed(3),
      deviation: diff,
      matched,
    });

    if (matched) {
      matchedProperties.push('birefringence');
      matchedWeight += PROPERTY_WEIGHTS.birefringence;
    }
  } else if (criteria.birefringence !== undefined) {
    totalWeight += PROPERTY_WEIGHTS.birefringence;
    matchDetails.push({
      property: 'Birefringence',
      measured: criteria.birefringence.toFixed(3),
      expected: 'N/A',
      matched: false,
    });
  }

  // Dispersion matching
  if (criteria.dispersion !== undefined && mineral.dispersion != null) {
    totalWeight += PROPERTY_WEIGHTS.dispersion;
    const diff = Math.abs(criteria.dispersion - mineral.dispersion);
    const matched = diff <= tolerances.dispersion;

    matchDetails.push({
      property: 'Dispersion',
      measured: criteria.dispersion.toFixed(3),
      expected: mineral.dispersion.toFixed(3),
      deviation: diff,
      matched,
    });

    if (matched) {
      matchedProperties.push('dispersion');
      matchedWeight += PROPERTY_WEIGHTS.dispersion;
    }
  } else if (criteria.dispersion !== undefined) {
    totalWeight += PROPERTY_WEIGHTS.dispersion;
    matchDetails.push({
      property: 'Dispersion',
      measured: criteria.dispersion.toFixed(3),
      expected: 'N/A',
      matched: false,
    });
  }

  // Hardness matching
  if (criteria.hardness !== undefined && mineral.hardness) {
    totalWeight += PROPERTY_WEIGHTS.hardness;
    const hardnessRange = parseHardness(mineral.hardness);
    let matched = false;
    let deviation: number | undefined;

    if (hardnessRange) {
      const [min, max] = hardnessRange;
      matched = criteria.hardness >= min - tolerances.hardness &&
                criteria.hardness <= max + tolerances.hardness;
      deviation = matched ? 0 : Math.min(
        Math.abs(criteria.hardness - min),
        Math.abs(criteria.hardness - max)
      );
    }

    matchDetails.push({
      property: 'Hardness',
      measured: criteria.hardness.toFixed(1),
      expected: mineral.hardness,
      deviation,
      matched,
    });

    if (matched) {
      matchedProperties.push('hardness');
      matchedWeight += PROPERTY_WEIGHTS.hardness;
    }
  } else if (criteria.hardness !== undefined) {
    totalWeight += PROPERTY_WEIGHTS.hardness;
    matchDetails.push({
      property: 'Hardness',
      measured: criteria.hardness.toFixed(1),
      expected: 'N/A',
      matched: false,
    });
  }

  // Crystal system matching (exact)
  if (criteria.crystalSystem) {
    totalWeight += PROPERTY_WEIGHTS.crystalSystem;
    const mineralSystem = mineral.system?.toLowerCase();
    const criteriaSystem = criteria.crystalSystem.toLowerCase();
    const matched = mineralSystem === criteriaSystem;

    matchDetails.push({
      property: 'Crystal System',
      measured: criteria.crystalSystem,
      expected: mineral.system || 'N/A',
      matched,
    });

    if (matched) {
      matchedProperties.push('crystalSystem');
      matchedWeight += PROPERTY_WEIGHTS.crystalSystem;
    }
  }

  // Optic sign matching
  if (criteria.opticSign) {
    totalWeight += PROPERTY_WEIGHTS.opticSign;
    const mineralSign = parseOpticSign(mineral.optical_character);
    const matched = mineralSign === criteria.opticSign;

    matchDetails.push({
      property: 'Optic Sign',
      measured: criteria.opticSign,
      expected: mineralSign || 'N/A',
      matched,
    });

    if (matched) {
      matchedProperties.push('opticSign');
      matchedWeight += PROPERTY_WEIGHTS.opticSign;
    }
  }

  // Optic character matching (isotropic/uniaxial/biaxial based on crystal system)
  if (criteria.opticCharacter) {
    totalWeight += PROPERTY_WEIGHTS.opticCharacter;
    const mineralSystem = mineral.system?.toLowerCase();

    // Determine mineral's optic character from crystal system
    let mineralOpticChar: 'isotropic' | 'uniaxial' | 'biaxial' | null = null;
    if (mineralSystem === 'cubic' || mineralSystem === 'isometric') {
      mineralOpticChar = 'isotropic';
    } else if (mineralSystem === 'tetragonal' || mineralSystem === 'hexagonal' || mineralSystem === 'trigonal') {
      mineralOpticChar = 'uniaxial';
    } else if (mineralSystem === 'orthorhombic' || mineralSystem === 'monoclinic' || mineralSystem === 'triclinic') {
      mineralOpticChar = 'biaxial';
    }

    const matched = mineralOpticChar === criteria.opticCharacter;

    matchDetails.push({
      property: 'Optic Character',
      measured: criteria.opticCharacter,
      expected: mineralOpticChar || 'N/A',
      matched,
    });

    if (matched) {
      matchedProperties.push('opticCharacter');
      matchedWeight += PROPERTY_WEIGHTS.opticCharacter;
    }
  }

  // Calculate confidence score
  const confidenceScore = totalWeight > 0
    ? Math.round((matchedWeight / totalWeight) * 100)
    : 0;

  return {
    mineral,
    matchedProperties,
    confidenceScore,
    matchDetails,
    totalWeight,
    matchedWeight,
  };
}

/**
 * Find all matching minerals for given criteria.
 * Returns results sorted by confidence score (highest first).
 */
export function findMatches(
  minerals: Mineral[],
  criteria: IdentificationCriteria,
  tolerances: ToleranceSettings = DEFAULT_TOLERANCES,
  minConfidence: number = 1
): MatchResult[] {
  // Check if any criteria provided
  const hasCriteria = Object.values(criteria).some(v => v !== undefined && v !== '');
  if (!hasCriteria) return [];

  return minerals
    .map(mineral => calculateMatch(mineral, criteria, tolerances))
    .filter(result => result.confidenceScore >= minConfidence)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Get confidence level description.
 */
export function getConfidenceLevel(score: number): {
  label: string;
  level: 'excellent' | 'good' | 'partial' | 'weak';
} {
  if (score >= 90) return { label: 'Excellent match', level: 'excellent' };
  if (score >= 70) return { label: 'Good match', level: 'good' };
  if (score >= 50) return { label: 'Partial match', level: 'partial' };
  return { label: 'Weak match', level: 'weak' };
}

/**
 * Get CSS classes for confidence level display.
 */
export function getConfidenceClasses(level: 'excellent' | 'good' | 'partial' | 'weak'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'excellent':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'good':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'partial':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'weak':
      return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  }
}

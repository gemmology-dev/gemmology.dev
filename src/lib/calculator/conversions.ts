/**
 * Gemmological conversion formulas and calculations.
 */

// ============================================================================
// Specific Gravity (SG)
// ============================================================================

/**
 * Calculate specific gravity using hydrostatic weighing method.
 * SG = Weight in air / (Weight in air - Weight in water)
 */
export function calculateSG(weightInAir: number, weightInWater: number): number {
  if (weightInAir <= 0) return 0;
  const denominator = weightInAir - weightInWater;
  if (denominator <= 0) return 0;
  return weightInAir / denominator;
}

/**
 * Calculate weight in water from SG and weight in air.
 */
export function calculateWeightInWater(weightInAir: number, sg: number): number {
  if (sg <= 0) return 0;
  return weightInAir - (weightInAir / sg);
}

// ============================================================================
// Birefringence
// ============================================================================

/**
 * Calculate birefringence from maximum and minimum RI values.
 * Birefringence = RI(max) - RI(min)
 */
export function calculateBirefringence(riMax: number, riMin: number): number {
  return Math.abs(riMax - riMin);
}

/**
 * Classify birefringence strength.
 */
export function classifyBirefringence(birefringence: number): string {
  if (birefringence === 0) return 'None (Isotropic)';
  if (birefringence < 0.01) return 'Low';
  if (birefringence < 0.02) return 'Medium';
  if (birefringence < 0.05) return 'High';
  return 'Very High';
}

// ============================================================================
// Critical Angle (Total Internal Reflection)
// ============================================================================

/**
 * Calculate critical angle for total internal reflection.
 * sin(θc) = 1/RI
 * θc = arcsin(1/RI)
 */
export function calculateCriticalAngle(ri: number): number {
  if (ri < 1) return 0;
  const sinTheta = 1 / ri;
  if (sinTheta > 1) return 90;
  return Math.asin(sinTheta) * (180 / Math.PI);
}

/**
 * Get significance of critical angle for gem brilliance.
 */
export function getCriticalAngleSignificance(criticalAngle: number): string {
  if (criticalAngle < 25) return 'Very small - excellent light return (e.g., diamond)';
  if (criticalAngle < 35) return 'Small - good light return (e.g., zircon, demantoid)';
  if (criticalAngle < 45) return 'Moderate - average light return (e.g., corundum, spinel)';
  return 'Large - lower light return (e.g., quartz, feldspar)';
}

// ============================================================================
// Weight Conversions
// ============================================================================

/** 1 carat = 0.2 grams */
const CARAT_TO_GRAM = 0.2;
/** 1 gram = 1000 milligrams */
const GRAM_TO_MG = 1000;

export function caratToGram(carats: number): number {
  return carats * CARAT_TO_GRAM;
}

export function gramToCarat(grams: number): number {
  return grams / CARAT_TO_GRAM;
}

export function caratToMilligram(carats: number): number {
  return carats * CARAT_TO_GRAM * GRAM_TO_MG;
}

export function milligramToCarat(mg: number): number {
  return mg / (CARAT_TO_GRAM * GRAM_TO_MG);
}

export function gramToMilligram(grams: number): number {
  return grams * GRAM_TO_MG;
}

export function milligramToGram(mg: number): number {
  return mg / GRAM_TO_MG;
}

// ============================================================================
// Length Conversions
// ============================================================================

/** 1 inch = 25.4 mm */
const MM_PER_INCH = 25.4;

export function mmToInch(mm: number): number {
  return mm / MM_PER_INCH;
}

export function inchToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

// ============================================================================
// Temperature Conversions
// ============================================================================

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9 / 5) + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5 / 9;
}

// ============================================================================
// Carat Weight Estimation from Dimensions
// ============================================================================

/**
 * Shape correction factors for carat weight estimation.
 * These are approximate multipliers used in the gem trade.
 */
export const SHAPE_FACTORS: Record<string, number> = {
  'round-brilliant': 0.0061,
  'oval': 0.0062,
  'pear': 0.0059,
  'marquise': 0.0058,
  'emerald-cut': 0.0083,
  'cushion': 0.0080,
  'princess': 0.0083,
  'heart': 0.0059,
  'radiant': 0.0081,
};

/**
 * Estimate carat weight from dimensions and specific gravity.
 * Weight (ct) = Length × Width × Depth × SG × Shape Factor
 *
 * @param length Length in mm
 * @param width Width in mm
 * @param depth Depth in mm
 * @param sg Specific gravity
 * @param shape Shape name (for factor lookup)
 * @returns Estimated carat weight
 */
export function estimateCaratWeight(
  length: number,
  width: number,
  depth: number,
  sg: number,
  shape: keyof typeof SHAPE_FACTORS = 'round-brilliant'
): number {
  const factor = SHAPE_FACTORS[shape] || SHAPE_FACTORS['round-brilliant'];
  return length * width * depth * sg * factor;
}

/**
 * Get diameter estimate for a round brilliant of given carat weight and SG.
 * Assumes standard proportions (depth ≈ 60% of diameter).
 */
export function estimateDiameter(caratWeight: number, sg: number): number {
  const factor = SHAPE_FACTORS['round-brilliant'];
  // For round: diameter = width = length, depth ≈ 0.6 * diameter
  // ct = d * d * (0.6 * d) * sg * factor
  // ct = 0.6 * d³ * sg * factor
  // d³ = ct / (0.6 * sg * factor)
  // d = ∛(ct / (0.6 * sg * factor))
  return Math.cbrt(caratWeight / (0.6 * sg * factor));
}

// ============================================================================
// Common Gem Reference Data
// ============================================================================

export interface GemReference {
  name: string;
  ri: number | [number, number];  // Single or range
  sg: number | [number, number];  // Single or range
  birefringence?: number;
  dispersion?: number;
  hardness: number | string;
}

export const COMMON_GEMS: GemReference[] = [
  { name: 'Diamond', ri: 2.417, sg: 3.52, dispersion: 0.044, hardness: 10 },
  { name: 'Ruby/Sapphire', ri: [1.762, 1.770], sg: [3.99, 4.00], birefringence: 0.008, dispersion: 0.018, hardness: 9 },
  { name: 'Emerald', ri: [1.570, 1.590], sg: [2.67, 2.78], birefringence: 0.006, dispersion: 0.014, hardness: '7.5-8' },
  { name: 'Spinel', ri: [1.712, 1.736], sg: [3.58, 3.61], dispersion: 0.020, hardness: 8 },
  { name: 'Topaz', ri: [1.609, 1.617], sg: [3.49, 3.57], birefringence: 0.010, dispersion: 0.014, hardness: 8 },
  { name: 'Tourmaline', ri: [1.624, 1.644], sg: [3.00, 3.25], birefringence: 0.018, dispersion: 0.017, hardness: '7-7.5' },
  { name: 'Quartz', ri: [1.544, 1.553], sg: 2.65, birefringence: 0.009, dispersion: 0.013, hardness: 7 },
  { name: 'Zircon', ri: [1.925, 1.984], sg: [4.0, 4.7], birefringence: 0.059, dispersion: 0.039, hardness: '6.5-7.5' },
  { name: 'Garnet (Pyrope)', ri: [1.730, 1.760], sg: [3.65, 3.87], dispersion: 0.022, hardness: '7-7.5' },
  { name: 'Garnet (Almandine)', ri: [1.760, 1.830], sg: [3.95, 4.30], dispersion: 0.024, hardness: '7-7.5' },
  { name: 'Peridot', ri: [1.654, 1.690], sg: [3.28, 3.48], birefringence: 0.036, dispersion: 0.020, hardness: '6.5-7' },
  { name: 'Aquamarine', ri: [1.570, 1.590], sg: [2.68, 2.74], birefringence: 0.006, dispersion: 0.014, hardness: '7.5-8' },
  { name: 'Tanzanite', ri: [1.691, 1.700], sg: [3.10, 3.38], birefringence: 0.009, dispersion: 0.021, hardness: '6-7' },
  { name: 'Alexandrite', ri: [1.745, 1.755], sg: [3.70, 3.73], birefringence: 0.009, dispersion: 0.015, hardness: 8.5 },
  { name: 'Opal', ri: [1.37, 1.47], sg: [1.98, 2.25], hardness: '5.5-6.5' },
];

/**
 * Find gems matching an RI value within a tolerance.
 */
export function findGemsByRI(ri: number, tolerance: number = 0.01): GemReference[] {
  return COMMON_GEMS.filter(gem => {
    if (Array.isArray(gem.ri)) {
      return ri >= gem.ri[0] - tolerance && ri <= gem.ri[1] + tolerance;
    }
    return Math.abs(gem.ri - ri) <= tolerance;
  });
}

/**
 * Find gems matching an SG value within a tolerance.
 */
export function findGemsBySG(sg: number, tolerance: number = 0.05): GemReference[] {
  return COMMON_GEMS.filter(gem => {
    if (Array.isArray(gem.sg)) {
      return sg >= gem.sg[0] - tolerance && sg <= gem.sg[1] + tolerance;
    }
    return Math.abs(gem.sg - sg) <= tolerance;
  });
}

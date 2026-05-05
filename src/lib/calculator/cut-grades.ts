/**
 * GIA-style cut-grade thresholds for round-brilliant diamonds.
 *
 * Each parameter (table %, depth %, crown angle, pavilion angle, girdle,
 * culet) maps to a per-grade range. The overall grade is the worst grade
 * among contributing parameters, and the parameter that *caused* the worst
 * grade is the "limiting parameter" surfaced in the UI.
 *
 * Data is paraphrased from publicly-documented GIA cut-grading thresholds
 * (Diamond Quality Document, Cut Grading System); use as educational
 * reference only — formal grading requires a calibrated proportionscope
 * and certified gemmologist.
 */

export type CutGradeBand = 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';

export const GRADE_RANK: Record<CutGradeBand, number> = {
  Excellent: 4,
  'Very Good': 3,
  Good: 2,
  Fair: 1,
  Poor: 0,
};

export type GirdleThickness =
  | 'extremely-thin'
  | 'very-thin'
  | 'thin'
  | 'medium'
  | 'slightly-thick'
  | 'thick'
  | 'very-thick'
  | 'extremely-thick';

export type CuletSize = 'none' | 'very-small' | 'small' | 'medium' | 'slightly-large' | 'large' | 'very-large' | 'extremely-large';

export interface CutGradeInputs {
  tablePercent?: number;
  depthPercent?: number;
  crownAngle?: number;
  pavilionAngle?: number;
  girdleThickness?: GirdleThickness;
  culetSize?: CuletSize;
}

export interface ParameterGrade {
  parameter: string;
  value: string;
  grade: CutGradeBand;
  comment: string;
}

export interface CutGradeResult {
  grade: CutGradeBand;
  parameterGrades: ParameterGrade[];
  /** The parameter that limited the overall grade (lowest band). */
  limitingParameter: ParameterGrade | null;
}

interface BandRange {
  min: number;
  max: number;
  grade: CutGradeBand;
}

/** Round-brilliant diamond table % bands (GIA). */
const TABLE_BANDS: BandRange[] = [
  { min: 53, max: 58, grade: 'Excellent' },
  { min: 51, max: 60, grade: 'Very Good' },
  { min: 50, max: 64, grade: 'Good' },
  { min: 47, max: 69, grade: 'Fair' },
  { min: 0, max: 100, grade: 'Poor' },
];

/** Round-brilliant total-depth % bands (GIA). */
const DEPTH_BANDS: BandRange[] = [
  { min: 59, max: 62.6, grade: 'Excellent' },
  { min: 58, max: 63.5, grade: 'Very Good' },
  { min: 56, max: 64.5, grade: 'Good' },
  { min: 53, max: 66.5, grade: 'Fair' },
  { min: 0, max: 100, grade: 'Poor' },
];

/** Crown-angle bands. */
const CROWN_BANDS: BandRange[] = [
  { min: 31.5, max: 36.5, grade: 'Excellent' },
  { min: 26.5, max: 38.5, grade: 'Very Good' },
  { min: 22.0, max: 40.0, grade: 'Good' },
  { min: 20.0, max: 41.5, grade: 'Fair' },
  { min: 0, max: 90, grade: 'Poor' },
];

/** Pavilion-angle bands (very narrow — pavilion is the sharpest constraint). */
const PAVILION_BANDS: BandRange[] = [
  { min: 40.6, max: 41.8, grade: 'Excellent' },
  { min: 39.8, max: 42.4, grade: 'Very Good' },
  { min: 39.0, max: 43.0, grade: 'Good' },
  { min: 38.0, max: 43.8, grade: 'Fair' },
  { min: 0, max: 90, grade: 'Poor' },
];

const GIRDLE_GRADES: Record<GirdleThickness, CutGradeBand> = {
  'extremely-thin': 'Poor',
  'very-thin': 'Good',
  thin: 'Excellent',
  medium: 'Excellent',
  'slightly-thick': 'Excellent',
  thick: 'Very Good',
  'very-thick': 'Good',
  'extremely-thick': 'Fair',
};

const CULET_GRADES: Record<CuletSize, CutGradeBand> = {
  none: 'Excellent',
  'very-small': 'Excellent',
  small: 'Excellent',
  medium: 'Very Good',
  'slightly-large': 'Good',
  large: 'Fair',
  'very-large': 'Poor',
  'extremely-large': 'Poor',
};

function classifyByBands(value: number, bands: BandRange[]): CutGradeBand {
  for (const band of bands) {
    if (value >= band.min && value <= band.max) return band.grade;
  }
  return 'Poor';
}

function describe(parameter: string, value: string, grade: CutGradeBand): ParameterGrade {
  const blurb: Record<CutGradeBand, string> = {
    Excellent: 'within ideal range',
    'Very Good': 'slightly outside ideal',
    Good: 'noticeably outside ideal',
    Fair: 'well outside ideal — visible light leakage likely',
    Poor: 'severe deviation — significant performance impact',
  };
  return {
    parameter,
    value,
    grade,
    comment: `${parameter} ${value} is ${blurb[grade]}.`,
  };
}

/**
 * Compute a GIA-style cut grade for a round-brilliant diamond.
 *
 * The overall grade equals the worst per-parameter grade; the parameter that
 * limited it is returned so the UI can surface the "limiting parameter"
 * callout (e.g. "Pavilion angle 42.5° pushes this from Excellent to Good").
 */
export function gradeRoundBrilliant(inputs: CutGradeInputs): CutGradeResult {
  const grades: ParameterGrade[] = [];

  if (inputs.tablePercent !== undefined && !isNaN(inputs.tablePercent)) {
    grades.push(
      describe('Table %', `${inputs.tablePercent}%`, classifyByBands(inputs.tablePercent, TABLE_BANDS)),
    );
  }
  if (inputs.depthPercent !== undefined && !isNaN(inputs.depthPercent)) {
    grades.push(
      describe('Total depth %', `${inputs.depthPercent}%`, classifyByBands(inputs.depthPercent, DEPTH_BANDS)),
    );
  }
  if (inputs.crownAngle !== undefined && !isNaN(inputs.crownAngle)) {
    grades.push(
      describe('Crown angle', `${inputs.crownAngle}°`, classifyByBands(inputs.crownAngle, CROWN_BANDS)),
    );
  }
  if (inputs.pavilionAngle !== undefined && !isNaN(inputs.pavilionAngle)) {
    grades.push(
      describe('Pavilion angle', `${inputs.pavilionAngle}°`, classifyByBands(inputs.pavilionAngle, PAVILION_BANDS)),
    );
  }
  if (inputs.girdleThickness) {
    grades.push(
      describe('Girdle thickness', inputs.girdleThickness.replace(/-/g, ' '), GIRDLE_GRADES[inputs.girdleThickness]),
    );
  }
  if (inputs.culetSize) {
    grades.push(describe('Culet size', inputs.culetSize.replace(/-/g, ' '), CULET_GRADES[inputs.culetSize]));
  }

  if (grades.length === 0) {
    return { grade: 'Poor', parameterGrades: [], limitingParameter: null };
  }

  const sorted = [...grades].sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade]);
  const worst = sorted[0];

  return {
    grade: worst.grade,
    parameterGrades: grades,
    limitingParameter: worst,
  };
}

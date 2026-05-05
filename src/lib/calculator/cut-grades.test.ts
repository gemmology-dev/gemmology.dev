import { describe, it, expect } from 'vitest';
import { gradeRoundBrilliant } from './cut-grades';

describe('gradeRoundBrilliant', () => {
  it('returns Excellent for textbook Tolkowsky proportions', () => {
    const r = gradeRoundBrilliant({
      tablePercent: 57,
      depthPercent: 61.5,
      crownAngle: 34.5,
      pavilionAngle: 40.75,
      girdleThickness: 'medium',
      culetSize: 'none',
    });
    expect(r.grade).toBe('Excellent');
  });

  it('downgrades to Good when pavilion angle is steep', () => {
    const r = gradeRoundBrilliant({
      tablePercent: 57,
      depthPercent: 61.5,
      crownAngle: 34.5,
      pavilionAngle: 42.8,
      girdleThickness: 'medium',
      culetSize: 'none',
    });
    expect(r.grade).toBe('Good');
    expect(r.limitingParameter?.parameter).toBe('Pavilion angle');
  });

  it('flags extremely-thin girdle as Poor regardless of other proportions', () => {
    const r = gradeRoundBrilliant({
      tablePercent: 57,
      depthPercent: 61.5,
      girdleThickness: 'extremely-thin',
    });
    expect(r.grade).toBe('Poor');
    expect(r.limitingParameter?.parameter).toBe('Girdle thickness');
  });

  it('handles partial inputs', () => {
    const r = gradeRoundBrilliant({ tablePercent: 57 });
    expect(r.grade).toBe('Excellent');
    expect(r.parameterGrades).toHaveLength(1);
  });

  it('returns Poor with no inputs', () => {
    const r = gradeRoundBrilliant({});
    expect(r.grade).toBe('Poor');
    expect(r.limitingParameter).toBeNull();
  });
});

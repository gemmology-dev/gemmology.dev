import { describe, it, expect } from 'vitest';
import {
  parseOpticalCharacter,
  uniaxialSign,
  biaxialSign,
  biaxial2V,
  characterMatches,
} from './optic-character';

describe('parseOpticalCharacter', () => {
  it('parses isotropic', () => {
    expect(parseOpticalCharacter('Isotropic')).toMatchObject({ kind: 'isotropic', sign: 'n/a' });
  });
  it('parses uniaxial positive', () => {
    expect(parseOpticalCharacter('Uniaxial +')).toMatchObject({ kind: 'uniaxial', sign: '+' });
  });
  it('parses uniaxial negative', () => {
    expect(parseOpticalCharacter('Uniaxial -')).toMatchObject({ kind: 'uniaxial', sign: '-' });
  });
  it('parses biaxial both signs', () => {
    expect(parseOpticalCharacter('Biaxial + or -')).toMatchObject({
      kind: 'biaxial',
      sign: '+/-',
    });
  });
  it('treats AGG as aggregate', () => {
    expect(parseOpticalCharacter('AGG').kind).toBe('aggregate');
  });
  it('treats opaque metallic as opaque', () => {
    expect(parseOpticalCharacter('Opaque (metallic)').kind).toBe('opaque');
  });
  it('returns unknown for empty string', () => {
    expect(parseOpticalCharacter('')).toEqual({ kind: 'unknown', sign: 'n/a' });
  });
  it('handles "Isotropic to near-isotropic (AGG)" as isotropic', () => {
    expect(parseOpticalCharacter('Isotropic to near-isotropic (AGG)').kind).toBe('isotropic');
  });
});

describe('uniaxialSign', () => {
  it('returns + when epsilon > omega (e.g. quartz: 1.544 / 1.553)', () => {
    expect(uniaxialSign(1.544, 1.553)).toBe('+');
  });
  it('returns - when epsilon < omega (e.g. ruby: 1.770 / 1.762)', () => {
    expect(uniaxialSign(1.77, 1.762)).toBe('-');
  });
});

describe('biaxialSign', () => {
  it('returns + when β closer to α (forsterite-end peridot ~ 1.635 / 1.651 / 1.670)', () => {
    // γ-β = 0.019, β-α = 0.016 → β closer to α → biaxial positive
    expect(biaxialSign(1.635, 1.651, 1.67)).toBe('+');
  });
  it('returns - when β closer to γ', () => {
    // γ-β = 0.005, β-α = 0.030 → β closer to γ → biaxial negative
    expect(biaxialSign(1.5, 1.53, 1.535)).toBe('-');
  });
});

describe('biaxial2V', () => {
  it('computes a sane positive angle from valid indices', () => {
    const v = biaxial2V(1.635, 1.651, 1.67);
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(0);
    expect(v!).toBeLessThan(90);
  });
  it('returns null on degenerate input', () => {
    expect(biaxial2V(1.5, 1.5, 1.5)).toBeNull();
  });
});

describe('characterMatches', () => {
  it('matches identical character + sign', () => {
    expect(
      characterMatches('uniaxial', '+', { kind: 'uniaxial', sign: '+' }),
    ).toBe(true);
  });
  it('rejects character mismatch', () => {
    expect(
      characterMatches('uniaxial', '+', { kind: 'biaxial', sign: '+' }),
    ).toBe(false);
  });
  it('rejects sign mismatch', () => {
    expect(
      characterMatches('uniaxial', '+', { kind: 'uniaxial', sign: '-' }),
    ).toBe(false);
  });
  it('accepts +/- references for either sign', () => {
    expect(
      characterMatches('uniaxial', '+', { kind: 'uniaxial', sign: '+/-' }),
    ).toBe(true);
    expect(
      characterMatches('uniaxial', '-', { kind: 'uniaxial', sign: '+/-' }),
    ).toBe(true);
  });
  it('accepts unknown observed sign as wildcard', () => {
    expect(
      characterMatches('biaxial', 'n/a', { kind: 'biaxial', sign: '-' }),
    ).toBe(true);
  });
});

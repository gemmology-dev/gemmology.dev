import { describe, it, expect } from 'vitest';
import { parseFluorescence, scoreUvMatch } from './parse-fluorescence';

describe('parseFluorescence', () => {
  it('returns inert for both bands when text is just "inert"', () => {
    const fl = parseFluorescence('Inert');
    expect(fl?.lwuv?.intensity).toBe('inert');
    expect(fl?.swuv?.intensity).toBe('inert');
  });

  it('extracts LW colour and intensity', () => {
    const fl = parseFluorescence('LW: red strong; SW: inert');
    expect(fl?.lwuv?.color).toBe('red');
    expect(fl?.lwuv?.intensity).toBe('strong');
    expect(fl?.swuv?.intensity).toBe('inert');
  });

  it('handles "long-wave" / "short-wave" wording', () => {
    const fl = parseFluorescence('Long-wave UV strong red, short-wave weak');
    expect(fl?.lwuv?.intensity).toBe('strong');
    expect(fl?.swuv?.intensity).toBe('weak');
  });

  it('returns null for empty input', () => {
    expect(parseFluorescence('')).toBeNull();
    expect(parseFluorescence(null)).toBeNull();
  });

  it('detects phosphorescence', () => {
    const fl = parseFluorescence('LW: blue moderate; phosphoresces yellow');
    expect(fl?.phosphorescence).toMatch(/phosphoresc/);
  });
});

describe('scoreUvMatch', () => {
  it('returns 0 for null fluorescence', () => {
    expect(
      scoreUvMatch(
        { lwuvIntensity: 'strong', lwuvColor: 'red', swuvIntensity: 'inert', swuvColor: '' },
        null,
      ),
    ).toBe(0);
  });

  it('scores high for matching colour and intensity', () => {
    const fl = parseFluorescence('LW: red strong; SW: inert')!;
    const score = scoreUvMatch(
      { lwuvIntensity: 'strong', lwuvColor: 'red', swuvIntensity: 'inert', swuvColor: '' },
      fl,
    );
    expect(score).toBeGreaterThan(0.8);
  });

  it('scores low for mismatched colour', () => {
    const fl = parseFluorescence('LW: red strong; SW: inert')!;
    const score = scoreUvMatch(
      { lwuvIntensity: 'strong', lwuvColor: 'green', swuvIntensity: 'inert', swuvColor: '' },
      fl,
    );
    expect(score).toBeLessThanOrEqual(0.7);
  });
});

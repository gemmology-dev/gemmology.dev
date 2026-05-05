import { describe, it, expect } from 'vitest';
import { matchBands } from './match-bands';

describe('matchBands', () => {
  it('ranks ruby top when chrome doublet observed', () => {
    const r = matchBands([693, 555, 476], 5);
    expect(r[0].reference.name).toMatch(/Ruby/);
    expect(r[0].hasSelective).toBe(true);
  });

  it('ranks almandine top for the 504 / 527 / 576 trio', () => {
    const r = matchBands([504, 527, 576], 4);
    expect(r[0].reference.name).toMatch(/Almandine/);
  });

  it('returns empty for no observations', () => {
    expect(matchBands([], 5)).toEqual([]);
  });

  it('respects tolerance — 700 nm does not match the 692 ruby line at ±5', () => {
    const r = matchBands([700], 5);
    expect(r.find((m) => m.reference.name.match(/Ruby/))).toBeUndefined();
  });

  it('matches blue sapphire on the 450 nm Fe³⁺ line', () => {
    const r = matchBands([450], 4);
    expect(r[0].reference.name).toMatch(/sapphire/i);
  });

  it('matches zircon on the 653 nm uranium line', () => {
    const r = matchBands([653], 4);
    expect(r[0].reference.name).toMatch(/Zircon/);
  });
});

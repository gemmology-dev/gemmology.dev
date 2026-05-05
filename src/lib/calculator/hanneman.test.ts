import { describe, it, expect } from 'vitest';
import {
  inferRIBand,
  combineBands,
  filterMineralsByBand,
  CONTACT_LIQUIDS,
} from './hanneman';
import type { Mineral } from '../db';

const minerals: Partial<Mineral>[] = [
  { id: 'diamond', name: 'Diamond', ri_min: 2.417, ri_max: 2.419 },
  { id: 'zircon', name: 'Zircon', ri_min: 1.92, ri_max: 1.98 },
  { id: 'corundum', name: 'Corundum', ri_min: 1.762, ri_max: 1.778 },
  { id: 'spinel', name: 'Spinel', ri_min: 1.712, ri_max: 1.736 },
  { id: 'quartz', name: 'Quartz', ri_min: 1.544, ri_max: 1.553 },
];

describe('inferRIBand', () => {
  it('returns an upper-open band for higher relief than the densest fluid', () => {
    const band = inferRIBand({ liquidId: 'methylene-iodide-si', relief: 'higher' });
    expect(band).not.toBeNull();
    expect(band!.min).toBeGreaterThan(1.81);
    expect(band!.max).toBeGreaterThanOrEqual(2.5);
  });

  it('returns a tight band centred on the liquid for equal relief', () => {
    const band = inferRIBand({ liquidId: 'methylene-iodide', relief: 'equal' });
    expect(band).not.toBeNull();
    expect(band!.min).toBeLessThan(1.74);
    expect(band!.max).toBeGreaterThan(1.74);
  });

  it('rejects unknown liquid id', () => {
    expect(inferRIBand({ liquidId: 'nonsense', relief: 'equal' })).toBeNull();
  });
});

describe('combineBands', () => {
  it('intersects two consistent observations to a tight band', () => {
    const band = combineBands([
      { liquidId: 'methylene-iodide', relief: 'higher' },
      { liquidId: 'methylene-iodide-si', relief: 'lower' },
    ]);
    expect(band).not.toBeNull();
    expect(band!.min).toBeGreaterThanOrEqual(1.74);
    expect(band!.max).toBeLessThanOrEqual(1.81);
  });

  it('returns inverted band when observations conflict', () => {
    const band = combineBands([
      { liquidId: 'water', relief: 'lower' },
      { liquidId: 'methylene-iodide-si', relief: 'higher' },
    ]);
    expect(band).not.toBeNull();
    expect(band!.min).toBeGreaterThan(band!.max);
  });
});

describe('filterMineralsByBand', () => {
  it('selects diamond and zircon for the OTL band', () => {
    const band = inferRIBand({ liquidId: 'methylene-iodide-si', relief: 'higher' })!;
    const out = filterMineralsByBand(band, minerals as Mineral[]);
    expect(out.find((m) => m.mineral.name === 'Diamond')).toBeDefined();
    expect(out.find((m) => m.mineral.name === 'Zircon')).toBeDefined();
    expect(out.find((m) => m.mineral.name === 'Quartz')).toBeUndefined();
  });

  it('orders matches by closest centre', () => {
    // Spinel centre 1.724, Corundum centre 1.770; band centre at 1.74 favours Spinel.
    const band = inferRIBand({ liquidId: 'methylene-iodide', relief: 'equal' })!;
    const out = filterMineralsByBand(band, minerals as Mineral[]);
    expect(out[0].mineral.name).toBe('Spinel');
    expect(out.find((m) => m.mineral.name === 'Corundum')).toBeDefined();
  });
});

describe('CONTACT_LIQUIDS', () => {
  it('lists liquids in ascending RI order', () => {
    for (let i = 1; i < CONTACT_LIQUIDS.length; i++) {
      expect(CONTACT_LIQUIDS[i].ri).toBeGreaterThanOrEqual(CONTACT_LIQUIDS[i - 1].ri);
    }
  });
});

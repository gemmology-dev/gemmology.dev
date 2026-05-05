import { describe, it, expect } from 'vitest';
import { matchPleochroism, interpretColourCount } from './match-pleochroism';
import type { Mineral } from '../db';

const fixture: Partial<Mineral>[] = [
  {
    id: 'andalusite',
    name: 'Andalusite',
    pleochroism_color1: 'yellowish-brown',
    pleochroism_color2: 'greenish-brown',
    pleochroism_color3: 'reddish-brown',
    pleochroism_strength: 'very_strong',
  },
  {
    id: 'tanzanite',
    name: 'Tanzanite',
    pleochroism_color1: 'blue',
    pleochroism_color2: 'purple',
    pleochroism_color3: 'bronze',
    pleochroism_strength: 'very_strong',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    pleochroism_color1: 'red',
    pleochroism_color2: 'orangy-red',
    pleochroism_strength: 'strong',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    pleochroism_strength: 'none',
  },
  {
    id: 'quartz',
    name: 'Quartz',
    pleochroism_color1: 'colourless',
    pleochroism_color2: 'pale violet',
    pleochroism_strength: 'weak',
  },
];

describe('matchPleochroism', () => {
  it('ranks andalusite top for the canonical brown trichroism', () => {
    const r = matchPleochroism(
      {
        colourCount: 3,
        colours: ['yellowish-brown', 'greenish-brown', 'reddish-brown'],
        strength: 'very_strong',
      },
      fixture as Mineral[],
    );
    expect(r[0].mineral.name).toBe('Andalusite');
  });

  it('excludes dichroic gems when 3 colours observed', () => {
    const r = matchPleochroism(
      {
        colourCount: 3,
        colours: ['red', 'orangy-red'],
        strength: 'strong',
      },
      fixture as Mineral[],
    );
    expect(r.find((m) => m.mineral.name === 'Ruby')).toBeUndefined();
  });

  it('matches ruby on 2-colour red observation', () => {
    const r = matchPleochroism(
      {
        colourCount: 2,
        colours: ['red', 'orangy-red'],
        strength: 'strong',
      },
      fixture as Mineral[],
    );
    expect(r[0].mineral.name).toBe('Ruby');
  });

  it('skips minerals with no stored pleochroism colours', () => {
    const r = matchPleochroism(
      {
        colourCount: 1,
        colours: ['white'],
        strength: 'unknown',
      },
      fixture as Mineral[],
    );
    expect(r.find((m) => m.mineral.name === 'Diamond')).toBeUndefined();
  });
});

describe('interpretColourCount', () => {
  it('returns biaxial systems for 3 colours', () => {
    expect(interpretColourCount(3).body).toMatch(/biaxial/);
  });
  it('returns uniaxial systems for 2 colours', () => {
    expect(interpretColourCount(2).body).toMatch(/uniaxial/);
  });
});

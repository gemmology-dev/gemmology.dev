import { describe, it, expect } from 'vitest';
import { runWizard, cluesForKind, CLUES } from './wizard';

describe('runWizard', () => {
  it('flags heat treatment when silk halos and chalky SWUV observed in corundum', () => {
    const verdicts = runWizard({
      gemKind: 'corundum',
      selectedClueIds: ['silk-halo', 'chalky-swuv'],
    });
    const heat = verdicts.find((v) => v.treatment === 'heat');
    expect(heat).toBeDefined();
    expect(heat!.confidence).toMatch(/likely|very likely/);
    expect(heat!.supportingClueIds).toContain('silk-halo');
    expect(heat!.supportingClueIds).toContain('chalky-swuv');
  });

  it('rules out heat when sharp intact silk is observed', () => {
    const verdicts = runWizard({
      gemKind: 'corundum',
      selectedClueIds: ['rutile-silk-intact'],
    });
    const heat = verdicts.find((v) => v.treatment === 'heat');
    expect(heat).toBeDefined();
    expect(heat!.score).toBeLessThan(0);
    expect(heat!.contradictingClueIds).toContain('rutile-silk-intact');
  });

  it('flags glass / oil filling when flash effect and surface bubbles seen', () => {
    const verdicts = runWizard({
      gemKind: 'emerald',
      selectedClueIds: ['flash-effect', 'surface-bubbles', 'sweat-test'],
    });
    const top = verdicts[0];
    expect(['oil-resin', 'glass-filling']).toContain(top.treatment);
    expect(top.confidence).toBe('very likely');
  });

  it('flags HPHT for diamond decolourisation', () => {
    const verdicts = runWizard({
      gemKind: 'diamond',
      selectedClueIds: ['diamond-brown-to-colourless', 'graining-strong'],
    });
    expect(verdicts[0].treatment).toBe('hpht');
    expect(verdicts[0].confidence).toBe('very likely');
  });

  it('skips clues that do not apply to the chosen gem kind', () => {
    const verdicts = runWizard({
      gemKind: 'topaz',
      selectedClueIds: ['silk-halo', 'colour-fades-light'],
    });
    expect(verdicts.find((v) => v.treatment === 'heat')).toBeUndefined();
    const irr = verdicts.find((v) => v.treatment === 'irradiation');
    expect(irr).toBeDefined();
    expect(irr!.supportingClueIds).toContain('colour-fades-light');
  });

  it('returns empty list when no clues selected', () => {
    expect(runWizard({ gemKind: 'corundum', selectedClueIds: [] })).toEqual([]);
  });

  it('flags bleaching+resin for acid-etched jadeite', () => {
    const verdicts = runWizard({
      gemKind: 'jadeite',
      selectedClueIds: ['jadeite-acid-etch', 'porous-or-low-density'],
    });
    const bleach = verdicts.find((v) => v.treatment === 'bleaching');
    expect(bleach).toBeDefined();
    expect(bleach!.confidence).toMatch(/likely|very likely/);
  });
});

describe('cluesForKind', () => {
  it('filters out gem-specific clues that do not apply', () => {
    const topazClues = cluesForKind('topaz');
    expect(topazClues.find((c) => c.id === 'silk-halo')).toBeUndefined();
    expect(topazClues.find((c) => c.id === 'colour-fades-light')).toBeDefined();
  });

  it('returns generic clues regardless of kind', () => {
    const list = cluesForKind('opal');
    expect(list.find((c) => c.id === 'iridescent-surface')).toBeDefined();
    expect(list.find((c) => c.id === 'colour-removed-acetone')).toBeDefined();
  });

  it('every clue with no applicableTo restriction appears for any gem', () => {
    const generic = CLUES.filter((c) => !c.applicableTo);
    const pearlList = cluesForKind('pearl');
    for (const g of generic) {
      expect(pearlList.find((c) => c.id === g.id)).toBeDefined();
    }
  });
});

/**
 * Reference absorption-band data for the most-tested gem species.
 *
 * Wavelengths are in nanometres, sourced from standard gemmological reference
 * texts (GIA Coloured Stones manual, Hodgkinson's Visual Optics, Webster's
 * Gems). Intensity is qualitative: `weak` (faint band, easy to miss),
 * `moderate` (clearly visible), `strong` (sharp dark line).
 *
 * `selective` flags bands that uniquely identify the species (e.g. the
 * 504 nm line in almandine garnet, the chrome doublet at 692/694 nm in ruby).
 *
 * Stored separately from the SQLite mineral database — adding a column there
 * is a multi-day data-authoring effort. This TypeScript table is the
 * pragmatic v1 implementation; a future migration can populate
 * `minerals.absorption_bands_json` from this same data.
 */

export interface AbsorptionBand {
  /** Wavelength in nanometres. Use a single number for sharp lines; for broad bands list the centre. */
  wavelength: number;
  /** Optional secondary wavelength for doublets / triplets. */
  also?: number[];
  intensity: 'weak' | 'moderate' | 'strong';
  /** Cause of the band (Cr³⁺, Fe²⁺, didymium, etc.). */
  cause?: string;
  /** True when this band alone is highly diagnostic. */
  selective?: boolean;
  /** Short note explaining the band. */
  note?: string;
}

export interface SpectroscopeReference {
  /** Mineral family id, matches `mineral_families.id`. */
  familyId: string;
  /** Display name. */
  name: string;
  bands: AbsorptionBand[];
  /** Light-source caveats or viewing tips. */
  observationNotes?: string;
}

export const SPECTROSCOPE_REFERENCE: SpectroscopeReference[] = [
  // Chromophore: Cr³⁺ (chromium) — ruby, red spinel, alexandrite, emerald.
  {
    familyId: 'corundum',
    name: 'Ruby (Cr-corundum)',
    bands: [
      { wavelength: 692, also: [694], intensity: 'strong', cause: 'Cr³⁺ doublet (R-lines)', selective: true, note: 'Sharp red doublet at 692/694 nm: the textbook ruby fingerprint.' },
      { wavelength: 660, intensity: 'weak', cause: 'Cr³⁺' },
      { wavelength: 555, intensity: 'moderate', cause: 'Cr³⁺ broad absorption', note: 'Wide green absorption band.' },
      { wavelength: 476, intensity: 'moderate', cause: 'Cr³⁺' },
      { wavelength: 468, intensity: 'moderate', cause: 'Cr³⁺' },
    ],
    observationNotes: 'Use a strong incandescent or fibre-optic source; the doublet is much easier in the red transmission band.',
  },
  {
    familyId: 'spinel',
    name: 'Red spinel (Cr-spinel)',
    bands: [
      { wavelength: 685, intensity: 'strong', cause: 'Cr³⁺ "organ-pipe"', selective: true, note: 'Series of fine lines 670–690 nm called the organ-pipe spectrum.' },
      { wavelength: 656, intensity: 'moderate', cause: 'Cr³⁺' },
      { wavelength: 540, intensity: 'moderate', cause: 'Cr³⁺' },
    ],
  },
  {
    familyId: 'chrysoberyl',
    name: 'Alexandrite (Cr-chrysoberyl)',
    bands: [
      { wavelength: 680, also: [678], intensity: 'strong', cause: 'Cr³⁺ doublet', selective: true },
      { wavelength: 645, intensity: 'weak', cause: 'Cr³⁺' },
      { wavelength: 580, intensity: 'moderate', cause: 'Cr³⁺' },
      { wavelength: 468, intensity: 'moderate', cause: 'Cr³⁺' },
    ],
    observationNotes: 'Colour change is best seen by switching incandescent ↔ daylight, but the spectrum is identical in both.',
  },
  {
    familyId: 'beryl',
    name: 'Emerald (Cr-beryl)',
    bands: [
      { wavelength: 683, also: [680], intensity: 'strong', cause: 'Cr³⁺ doublet', selective: true },
      { wavelength: 637, intensity: 'weak', cause: 'Cr³⁺' },
      { wavelength: 606, intensity: 'weak', cause: 'Cr³⁺' },
      { wavelength: 477, intensity: 'moderate', cause: 'Cr³⁺ broad absorption' },
    ],
    observationNotes: 'Polariscope ω-ray gives strongest red doublet.',
  },
  // Chromophore: Fe³⁺ — blue sapphire, aquamarine.
  {
    familyId: 'corundum-blue',
    name: 'Blue sapphire (Fe-corundum)',
    bands: [
      { wavelength: 450, intensity: 'strong', cause: 'Fe³⁺', selective: true, note: 'Diagnostic 450 nm line in iron-rich blue sapphires.' },
      { wavelength: 460, intensity: 'moderate', cause: 'Fe³⁺' },
      { wavelength: 470, intensity: 'weak', cause: 'Fe³⁺' },
    ],
    observationNotes: 'Synthetic flame-fusion sapphire often lacks the 450 nm line; useful diagnostic.',
  },
  // Almandine garnet — Fe²⁺.
  {
    familyId: 'almandine',
    name: 'Almandine garnet (Fe²⁺)',
    bands: [
      { wavelength: 504, intensity: 'strong', cause: 'Fe²⁺', selective: true, note: 'The 504 nm line is the strongest Fe²⁺ band in almandine.' },
      { wavelength: 527, intensity: 'strong', cause: 'Fe²⁺' },
      { wavelength: 576, intensity: 'moderate', cause: 'Fe²⁺' },
      { wavelength: 423, intensity: 'weak', cause: 'Fe²⁺' },
    ],
    observationNotes: 'Strongest broad-band Fe²⁺ spectrum among gems; visible even in dark stones.',
  },
  // Didymium-bearing rare-earth gems.
  {
    familyId: 'apatite',
    name: 'Yellow apatite (didymium)',
    bands: [
      { wavelength: 580, intensity: 'strong', cause: 'didymium (Pr+Nd)', selective: true },
      { wavelength: 525, intensity: 'moderate', cause: 'didymium' },
      { wavelength: 512, intensity: 'moderate', cause: 'didymium' },
      { wavelength: 491, intensity: 'weak', cause: 'didymium' },
    ],
    observationNotes: 'Sharp didymium lines also seen in some sphene and rare yellow zircon.',
  },
  {
    familyId: 'sphene',
    name: 'Sphene / titanite',
    bands: [
      { wavelength: 586, intensity: 'moderate', cause: 'didymium' },
      { wavelength: 536, intensity: 'weak', cause: 'didymium' },
    ],
  },
  // Zircon — characteristic uranium-bearing spectrum.
  {
    familyId: 'zircon',
    name: 'Zircon (high type)',
    bands: [
      { wavelength: 653, intensity: 'strong', cause: 'U⁴⁺', selective: true, note: 'Classic uranium-line at 653.5 nm; strongest in heat-treated blue zircon.' },
      { wavelength: 659, intensity: 'moderate', cause: 'U⁴⁺' },
      { wavelength: 691, intensity: 'weak', cause: 'U⁴⁺' },
      { wavelength: 588, intensity: 'weak', cause: 'U⁴⁺' },
      { wavelength: 562, intensity: 'weak', cause: 'U⁴⁺' },
      { wavelength: 537, intensity: 'weak', cause: 'U⁴⁺' },
      { wavelength: 484, intensity: 'weak', cause: 'U⁴⁺' },
    ],
    observationNotes: 'Low-type (metamict) zircon shows weakened or no spectrum.',
  },
  // Peridot — Fe²⁺ triplet.
  {
    familyId: 'peridot',
    name: 'Peridot (forsterite-fayalite)',
    bands: [
      { wavelength: 493, intensity: 'strong', cause: 'Fe²⁺', selective: true, note: '"Three-lock-and-key" pattern: 493 / 473 / 453 nm.' },
      { wavelength: 473, intensity: 'strong', cause: 'Fe²⁺' },
      { wavelength: 453, intensity: 'strong', cause: 'Fe²⁺' },
    ],
  },
  // Diamond — N3 / N2 systems.
  {
    familyId: 'diamond',
    name: 'Cape-series diamond (N3)',
    bands: [
      { wavelength: 415, intensity: 'strong', cause: 'N3 centre', selective: true, note: 'Cape line at 415.5 nm: diagnostic of natural type-Ia diamond.' },
      { wavelength: 478, intensity: 'weak', cause: 'N3 / H3' },
      { wavelength: 504, intensity: 'weak', cause: 'H3 (irradiated)' },
    ],
    observationNotes: 'Best seen at low temperature with a strong UV-blocked white source.',
  },
  // Synthetic/treated diamond — different N-V centres.
  // Tourmaline — Cr/Fe/Mn pleochroic.
  {
    familyId: 'tourmaline',
    name: 'Cr-tourmaline (chrome dravite)',
    bands: [
      { wavelength: 685, intensity: 'moderate', cause: 'Cr³⁺ doublet', note: 'Less sharp than ruby.' },
      { wavelength: 460, intensity: 'moderate', cause: 'Cr³⁺' },
    ],
  },
  // Demantoid garnet — Cr + Fe.
  {
    familyId: 'andradite',
    name: 'Demantoid garnet',
    bands: [
      { wavelength: 444, intensity: 'strong', cause: 'Fe³⁺', selective: true, note: 'Diagnostic Fe³⁺ band at 440 nm distinguishes demantoid from chrysoberyl/peridot.' },
      { wavelength: 622, intensity: 'weak', cause: 'Cr³⁺' },
      { wavelength: 685, intensity: 'weak', cause: 'Cr³⁺' },
    ],
  },
  // Chrysoberyl yellow — Fe³⁺.
  {
    familyId: 'chrysoberyl-yellow',
    name: 'Yellow chrysoberyl (Fe)',
    bands: [
      { wavelength: 444, intensity: 'strong', cause: 'Fe³⁺', selective: true },
    ],
  },
  // Aquamarine — light Fe²⁺.
  {
    familyId: 'beryl-aqua',
    name: 'Aquamarine (Fe-beryl)',
    bands: [
      { wavelength: 537, intensity: 'weak', cause: 'Fe²⁺' },
      { wavelength: 456, intensity: 'weak', cause: 'Fe³⁺' },
      { wavelength: 427, intensity: 'weak', cause: 'Fe³⁺' },
    ],
    observationNotes: 'Spectrum is faint; lighter stones may show no bands.',
  },
];

/** All distinct wavelengths in the reference set, sorted ascending. */
export function getAllReferenceBands(): number[] {
  const seen = new Set<number>();
  for (const ref of SPECTROSCOPE_REFERENCE) {
    for (const b of ref.bands) {
      seen.add(b.wavelength);
      if (b.also) for (const w of b.also) seen.add(w);
    }
  }
  return Array.from(seen).sort((a, b) => a - b);
}

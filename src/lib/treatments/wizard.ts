/**
 * Treatment-detection wizard reasoning.
 *
 * Maps observed clues to candidate treatments per species. Evidence-weighted:
 * each clue contributes a positive (supports), neutral (consistent), or
 * negative (rules out) signal toward each treatment hypothesis.
 *
 * Source: GIA gem identification course material, Hughes' Ruby & Sapphire,
 * standard CIBJO Blue Book treatment definitions.
 */

export type GemKind =
  | 'corundum'
  | 'emerald'
  | 'beryl-other'
  | 'tourmaline'
  | 'topaz'
  | 'quartz'
  | 'amber'
  | 'turquoise'
  | 'jadeite'
  | 'opal'
  | 'pearl'
  | 'diamond';

export type TreatmentId =
  | 'heat'
  | 'oil-resin'
  | 'lattice-diffusion'
  | 'surface-diffusion'
  | 'irradiation'
  | 'coating'
  | 'glass-filling'
  | 'dye'
  | 'bleaching'
  | 'hpht'
  | 'flux-healing';

export interface ClueDef {
  id: string;
  label: string;
  description?: string;
  /** Per-treatment effect: positive supports, negative rules out, 0 means no impact. */
  effects: Partial<Record<TreatmentId, number>>;
  /** Restrict the clue to certain gem kinds (display filter). */
  applicableTo?: GemKind[];
}

export const TREATMENT_LABELS: Record<TreatmentId, string> = {
  heat: 'Heat treatment',
  'oil-resin': 'Oiling / resin filling',
  'lattice-diffusion': 'Lattice (Be / Ti) diffusion',
  'surface-diffusion': 'Surface diffusion (colour skin)',
  irradiation: 'Irradiation',
  coating: 'Surface coating / lacquer',
  'glass-filling': 'Lead-glass filling',
  dye: 'Dyeing',
  bleaching: 'Bleaching',
  hpht: 'HPHT colour modification',
  'flux-healing': 'Flux healing of fractures',
};

export const CLUES: ClueDef[] = [
  {
    id: 'silk-halo',
    label: 'Discoid halos / disrupted silk under magnification',
    description: 'Snowball-like discs around former rutile silk; classic of heated corundum.',
    effects: { heat: 3, 'lattice-diffusion': 1 },
    applicableTo: ['corundum'],
  },
  {
    id: 'rutile-silk-intact',
    label: 'Sharp, intact fine rutile silk',
    description: 'Long undamaged silk needles indicate the stone has not been strongly heated.',
    effects: { heat: -3, 'lattice-diffusion': -2 },
    applicableTo: ['corundum'],
  },
  {
    id: 'colour-concentration-rim',
    label: 'Colour concentration at facet edges / culet (rim of colour)',
    description: 'Colour follows facet edges from a thin diffused layer.',
    effects: { 'surface-diffusion': 4, 'lattice-diffusion': 2, dye: 1 },
    applicableTo: ['corundum'],
  },
  {
    id: 'chalky-swuv',
    label: 'Chalky / cloudy short-wave UV reaction',
    description: 'Chalky blue-white SW glow develops in heat-treated sapphires (especially geuda-derived).',
    effects: { heat: 3, 'lattice-diffusion': 2 },
    applicableTo: ['corundum'],
  },
  {
    id: 'flash-effect',
    label: 'Flash effect (blue/orange flash on tilt)',
    description: 'Blue / orange flash of light along fractures viewed at certain angles.',
    effects: { 'oil-resin': 4, 'glass-filling': 4 },
    applicableTo: ['emerald', 'corundum'],
  },
  {
    id: 'surface-bubbles',
    label: 'Round gas bubbles in surface-reaching fissures',
    description: 'Trapped during glass / resin filling.',
    effects: { 'glass-filling': 4, 'oil-resin': 2 },
    applicableTo: ['corundum', 'emerald', 'turquoise'],
  },
  {
    id: 'sweat-test',
    label: 'Residue / sweating after gentle warming',
    description: 'Oil or resin sweats out of fissures when stone is warmed.',
    effects: { 'oil-resin': 4 },
    applicableTo: ['emerald', 'beryl-other'],
  },
  {
    id: 'colour-zoning-strong',
    label: 'Strong straight or angular colour zoning',
    description: 'Natural growth zoning; rules out many homogenised treatments.',
    effects: { heat: -1, 'lattice-diffusion': -1 },
  },
  {
    id: 'colour-zoning-curved',
    label: 'Curved (Plato) colour bands',
    description: 'Curved striae indicate flame-fusion synthesis, not treatment.',
    effects: {},
  },
  {
    id: 'fingerprint-healed',
    label: 'Healed fingerprint inclusions / partial healing',
    description: 'Re-healed fractures from flux-assisted heating.',
    effects: { 'flux-healing': 3, heat: 2 },
    applicableTo: ['corundum'],
  },
  {
    id: 'flux-residue',
    label: 'Yellow / orange flux residue in fissures',
    description: 'Borax-like residue trapped during flux heating.',
    effects: { 'flux-healing': 4, heat: 1 },
    applicableTo: ['corundum'],
  },
  {
    id: 'colour-fades-light',
    label: 'Colour fades with prolonged light or heat',
    effects: { irradiation: 3, dye: 2, coating: 2 },
    applicableTo: ['topaz', 'tourmaline', 'beryl-other', 'quartz', 'turquoise'],
  },
  {
    id: 'colour-removed-acetone',
    label: 'Colour rubs / dissolves with acetone or alcohol swab',
    effects: { dye: 4, coating: 3 },
  },
  {
    id: 'iridescent-surface',
    label: 'Iridescent or oily surface sheen under reflection',
    effects: { coating: 4 },
  },
  {
    id: 'diamond-brown-to-colourless',
    label: 'Diamond changed from brown to colourless / yellow → colourless',
    effects: { hpht: 4 },
    applicableTo: ['diamond'],
  },
  {
    id: 'graining-strong',
    label: 'Strong internal graining / strain (HPHT diamond)',
    effects: { hpht: 2 },
    applicableTo: ['diamond'],
  },
  {
    id: 'porous-or-low-density',
    label: 'Porous / chalky surface or unusually low SG',
    effects: { dye: 2, bleaching: 3, 'oil-resin': 2 },
    applicableTo: ['turquoise', 'jadeite'],
  },
  {
    id: 'jadeite-acid-etch',
    label: 'Jadeite — acid-etched / honeycomb surface texture',
    effects: { bleaching: 4, 'oil-resin': 3 },
    applicableTo: ['jadeite'],
  },
];

export interface WizardCriteria {
  gemKind: GemKind;
  selectedClueIds: string[];
}

export interface TreatmentVerdict {
  treatment: TreatmentId;
  label: string;
  /** Aggregate evidence score; positive favours, negative argues against. */
  score: number;
  /** Verbal confidence band based on score. */
  confidence: 'unlikely' | 'possible' | 'likely' | 'very likely';
  /** Clues contributing positively to this verdict. */
  supportingClueIds: string[];
  /** Clues contributing negatively. */
  contradictingClueIds: string[];
}

const ALL_TREATMENTS: TreatmentId[] = Object.keys(TREATMENT_LABELS) as TreatmentId[];

export function runWizard(criteria: WizardCriteria): TreatmentVerdict[] {
  const verdicts: Record<TreatmentId, TreatmentVerdict> = {} as Record<TreatmentId, TreatmentVerdict>;
  for (const t of ALL_TREATMENTS) {
    verdicts[t] = {
      treatment: t,
      label: TREATMENT_LABELS[t],
      score: 0,
      confidence: 'unlikely',
      supportingClueIds: [],
      contradictingClueIds: [],
    };
  }

  for (const clueId of criteria.selectedClueIds) {
    const clue = CLUES.find((c) => c.id === clueId);
    if (!clue) continue;
    if (clue.applicableTo && !clue.applicableTo.includes(criteria.gemKind)) continue;
    for (const [tid, weight] of Object.entries(clue.effects) as [TreatmentId, number][]) {
      verdicts[tid].score += weight;
      if (weight > 0) verdicts[tid].supportingClueIds.push(clueId);
      else if (weight < 0) verdicts[tid].contradictingClueIds.push(clueId);
    }
  }

  for (const v of Object.values(verdicts)) {
    if (v.score >= 6) v.confidence = 'very likely';
    else if (v.score >= 3) v.confidence = 'likely';
    else if (v.score >= 1) v.confidence = 'possible';
    else v.confidence = 'unlikely';
  }

  return Object.values(verdicts)
    .filter((v) => v.score > 0 || v.contradictingClueIds.length > 0)
    .sort((a, b) => b.score - a.score);
}

export function cluesForKind(kind: GemKind): ClueDef[] {
  return CLUES.filter((c) => !c.applicableTo || c.applicableTo.includes(kind));
}

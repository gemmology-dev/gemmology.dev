/**
 * Treatment-detection wizard.
 *
 * Pick the gem kind, tick observed clues, get a ranked likelihood of which
 * treatments the stone has undergone. Evidence-weighted: each clue can support
 * or rule out individual treatments. Sister widget to the static
 * TreatmentDetection reference table.
 */

import { useMemo, useState } from 'react';
import {
  cluesForKind,
  runWizard,
  type GemKind,
  type TreatmentVerdict,
} from '../../lib/treatments/wizard';
import { FormField, Select } from '../form';

const GEM_KIND_OPTIONS: { value: GemKind; label: string }[] = [
  { value: 'corundum', label: 'Corundum (ruby / sapphire)' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'beryl-other', label: 'Other beryl (aqua, morganite, heliodor…)' },
  { value: 'tourmaline', label: 'Tourmaline' },
  { value: 'topaz', label: 'Topaz' },
  { value: 'quartz', label: 'Quartz / amethyst / citrine' },
  { value: 'amber', label: 'Amber' },
  { value: 'turquoise', label: 'Turquoise' },
  { value: 'jadeite', label: 'Jadeite' },
  { value: 'opal', label: 'Opal' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'diamond', label: 'Diamond' },
];

const CONFIDENCE_BADGE: Record<TreatmentVerdict['confidence'], string> = {
  unlikely: 'bg-slate-100 text-slate-700',
  possible: 'bg-amber-50 text-amber-800 border border-amber-200',
  likely: 'bg-orange-100 text-orange-800',
  'very likely': 'bg-rose-100 text-rose-800 border border-rose-200',
};

export function TreatmentWizard() {
  const [gemKind, setGemKind] = useState<GemKind>('corundum');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const availableClues = useMemo(() => cluesForKind(gemKind), [gemKind]);

  const verdicts = useMemo(
    () => runWizard({ gemKind, selectedClueIds: Array.from(selected) }),
    [gemKind, selected],
  );

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGemChange = (next: string) => {
    setGemKind(next as GemKind);
    // Drop clues that no longer apply to the new kind.
    const allowedIds = new Set(cluesForKind(next as GemKind).map((c) => c.id));
    setSelected((s) => new Set(Array.from(s).filter((id) => allowedIds.has(id))));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Pick the gem kind, tick the clues you actually see under loupe, microscope, UV, or warming.
        The wizard weighs each clue and ranks treatments by likelihood. A negative score means the
        clue argues against that treatment.
      </p>

      <FormField name="treatment-gem-kind" label="Gem kind">
        <Select
          options={GEM_KIND_OPTIONS}
          value={gemKind}
          onChange={handleGemChange}
        />
      </FormField>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">
          Observed clues ({selected.size} ticked of {availableClues.length})
        </h4>
        <div className="space-y-2">
          {availableClues.map((clue) => {
            const isOn = selected.has(clue.id);
            return (
              <label
                key={clue.id}
                className={`flex gap-3 items-start p-2.5 rounded border cursor-pointer transition ${
                  isOn
                    ? 'bg-cyan-50 border-cyan-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(clue.id)}
                  className="mt-1 accent-cyan-600"
                />
                <div className="text-sm">
                  <div className="font-medium text-slate-800">{clue.label}</div>
                  {clue.description && (
                    <div className="text-xs text-slate-600 mt-0.5">{clue.description}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="mt-3 text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Clear all clues
          </button>
        )}
      </div>

      {selected.size === 0 ? (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
          Tick at least one clue above to see ranked treatments.
        </div>
      ) : verdicts.length === 0 ? (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center">
          Selected clues do not point to any common treatment — likely natural / untreated within
          the limits of these observations.
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            {verdicts.length} candidate treatment{verdicts.length === 1 ? '' : 's'}
          </h4>
          {verdicts.map((v) => (
            <div
              key={v.treatment}
              className="p-3 rounded-lg bg-white border border-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-slate-800">{v.label}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${CONFIDENCE_BADGE[v.confidence]}`}
                >
                  {v.confidence} (score {v.score >= 0 ? '+' : ''}
                  {v.score})
                </span>
              </div>
              {v.supportingClueIds.length > 0 && (
                <div className="mt-2 text-xs text-slate-700">
                  <span className="font-medium text-emerald-700">Supports:</span>{' '}
                  {v.supportingClueIds
                    .map((id) => availableClues.find((c) => c.id === id)?.label ?? id)
                    .join('; ')}
                </div>
              )}
              {v.contradictingClueIds.length > 0 && (
                <div className="mt-1 text-xs text-slate-700">
                  <span className="font-medium text-rose-700">Argues against:</span>{' '}
                  {v.contradictingClueIds
                    .map((id) => availableClues.find((c) => c.id === id)?.label ?? id)
                    .join('; ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-500 italic">
        Note: this wizard reasons over visual & instrumental clues only. Some treatments (e.g.
        beryllium lattice diffusion, low-temperature heating of pastel sapphire) require advanced
        spectroscopy (LIBS / FTIR / UV-Vis) for definitive detection. Consult a recognised gem
        laboratory when stakes are high.
      </div>
    </div>
  );
}

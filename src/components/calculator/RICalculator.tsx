/**
 * RI Lookup Calculator component.
 * Look up gems by refractive index value, with optional double-reading mode
 * that infers birefringence and optic character (SR vs DR) on the fly.
 */

import { useEffect, useMemo, useState } from 'react';
import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { useGemLookup, formatRI, formatSG } from '../../hooks/useGemLookup';
import { useCalculatorData } from '../../hooks/useCalculatorData';
import { validateRI } from './ValidationMessage';
import { FormField, NumberInput, Select } from '../form';
import { GemMatchList } from './results';
import { Table } from '../ui';
import {
  calculateBirefringence,
  classifyBirefringence,
} from '../../lib/calculator/conversions';

const TOLERANCE_OPTIONS = [
  { value: '0.005', label: '± 0.005 (Narrow)' },
  { value: '0.01', label: '± 0.01 (Standard)' },
  { value: '0.02', label: '± 0.02 (Wide)' },
  { value: '0.05', label: '± 0.05 (Very Wide)' },
];

const MODE_OPTIONS = [
  { value: 'single', label: 'Single reading' },
  { value: 'double', label: 'Double reading (anisotropic)' },
];

export function RICalculator() {
  const { fallbackGems } = useCalculatorData();

  const [mode, setMode] = useState<'single' | 'double'>('single');
  const [ri2, setRi2] = useState('');

  const { values, errors, result, setValue } = useCalculatorForm({
    fields: {
      ri: {
        validate: validateRI,
        parse: parseFloat,
      },
      tolerance: {
        parse: parseFloat,
        initialValue: '0.01',
        required: false,
      },
    },
    compute: ({ ri, tolerance }) => {
      if (ri === undefined || ri < 1) return null;
      return { ri, tolerance: tolerance ?? 0.01 };
    },
  });

  const ri2Error = mode === 'double' && ri2 ? validateRI(ri2) : null;

  const doubleReadingResult = useMemo(() => {
    if (mode !== 'double') return null;
    const a = result?.ri;
    const b = parseFloat(ri2);
    if (a === undefined || isNaN(b) || b < 1) return null;

    const birefringence = calculateBirefringence(a, b);
    const character = birefringence > 0.005 ? 'DR' : 'SR';
    const lookupRI = (a + b) / 2;

    return {
      ri1: Math.min(a, b),
      ri2: Math.max(a, b),
      birefringence,
      classification: classifyBirefringence(birefringence),
      character,
      characterLabel:
        character === 'DR'
          ? 'Doubly refractive (anisotropic: uniaxial or biaxial)'
          : 'Singly refractive within reading tolerance; likely cubic, amorphous, or read along an optic axis',
      lookupRI,
    };
  }, [mode, result?.ri, ri2]);

  // Use the average of the two readings when in double mode, otherwise the single reading.
  const lookupTarget = doubleReadingResult?.lookupRI ?? result?.ri ?? null;

  const { matches, lookup, initiate } = useGemLookup({
    type: 'ri',
    tolerance: parseFloat(values.tolerance) || 0.01,
  });

  useEffect(() => {
    lookup(lookupTarget);
  }, [lookupTarget, lookup]);

  return (
    <div className="space-y-6" onPointerDown={initiate}>
      <div className="text-sm text-slate-600 dark:text-cream-secondary">
        <p>Enter an RI reading to find matching gemstones. Toggle <strong>Double reading</strong> to enter both shadow-edge readings (ω/ε or α/γ) and infer birefringence + optic character automatically.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField name="ri-mode" label="Reading mode">
          <Select
            options={MODE_OPTIONS}
            value={mode}
            onChange={(v) => setMode(v as 'single' | 'double')}
          />
        </FormField>

        <FormField
          name="ri-lookup"
          label={mode === 'double' ? 'Reading 1 (lower)' : 'Refractive Index'}
          error={errors.ri}
        >
          <NumberInput
            value={values.ri}
            onChange={(v) => setValue('ri', v)}
            min={1}
            max={3}
            step={0.001}
            placeholder="e.g., 1.544"
          />
        </FormField>

        {mode === 'double' ? (
          <FormField name="ri-lookup-2" label="Reading 2 (upper)" error={ri2Error}>
            <NumberInput
              value={ri2}
              onChange={setRi2}
              min={1}
              max={3}
              step={0.001}
              placeholder="e.g., 1.553"
              hasError={!!ri2Error}
            />
          </FormField>
        ) : (
          <FormField name="ri-tolerance" label="Tolerance (±)">
            <Select
              options={TOLERANCE_OPTIONS}
              value={values.tolerance}
              onChange={(v) => setValue('tolerance', v)}
            />
          </FormField>
        )}
      </div>

      {mode === 'double' && (
        <FormField name="ri-tolerance-double" label="Match tolerance (±)">
          <Select
            options={TOLERANCE_OPTIONS}
            value={values.tolerance}
            onChange={(v) => setValue('tolerance', v)}
          />
        </FormField>
      )}

      {doubleReadingResult && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 text-sm space-y-1">
          <div className="font-semibold text-emerald-900 dark:text-emerald-300">Double-reading inference</div>
          <div className="text-emerald-800 dark:text-emerald-200">
            RI {doubleReadingResult.ri1.toFixed(3)} – {doubleReadingResult.ri2.toFixed(3)},
            birefringence <span className="font-mono">{doubleReadingResult.birefringence.toFixed(3)}</span>{' '}
            ({doubleReadingResult.classification})
          </div>
          <div className="text-emerald-800 dark:text-emerald-200">
            Optic character: <strong>{doubleReadingResult.character}</strong>. {doubleReadingResult.characterLabel}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-300">
            Matches below use the average RI ({doubleReadingResult.lookupRI.toFixed(3)}) ± {values.tolerance}.
          </div>
        </div>
      )}

      {lookupTarget !== null && (
        <div className="space-y-3">
          {matches.length > 0 ? (
            <GemMatchList
              gems={matches}
              matchedProperty="ri"
              label="Matching Gemstones"
              layout="list"
            />
          ) : (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 text-sm">
              No common gems found near RI {lookupTarget.toFixed(3)} (±{values.tolerance}). Try widening the tolerance or
              checking your readings.
            </div>
          )}
        </div>
      )}

      {/* Reference table */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-cream-secondary mb-2">Common Gem RI Reference</h4>
        <div className="max-h-64 overflow-y-auto">
          <Table
            columns={[
              { key: 'name', header: 'Gem' },
              { key: 'ri', header: 'RI', mono: true },
              { key: 'sg', header: 'SG', mono: true },
            ]}
            rows={fallbackGems.map(gem => ({
              name: gem.name,
              ri: formatRI(gem.ri),
              sg: formatSG(gem.sg),
            }))}
            variant="minimal"
          />
        </div>
      </div>
    </div>
  );
}

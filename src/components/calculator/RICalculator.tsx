/**
 * RI Lookup Calculator component.
 * Look up gems by refractive index value.
 * Uses database with fallback to hardcoded reference data.
 */

import { useEffect } from 'react';
import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { useGemLookup, formatRI, formatSG } from '../../hooks/useGemLookup';
import { useCalculatorData } from '../../hooks/useCalculatorData';
import { validateRI } from './ValidationMessage';
import { FormField, NumberInput, Select } from '../form';
import { GemMatchList } from './results';

const TOLERANCE_OPTIONS = [
  { value: '0.005', label: '± 0.005 (Narrow)' },
  { value: '0.01', label: '± 0.01 (Standard)' },
  { value: '0.02', label: '± 0.02 (Wide)' },
  { value: '0.05', label: '± 0.05 (Very Wide)' },
];

export function RICalculator() {
  const { fallbackGems } = useCalculatorData();

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

  // Gem lookup with debouncing
  const { matches, lookup } = useGemLookup({
    type: 'ri',
    tolerance: parseFloat(values.tolerance) || 0.01,
  });

  // Trigger lookup when RI result changes
  useEffect(() => {
    lookup(result?.ri ?? null);
  }, [result?.ri, lookup]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter an RI reading to find matching gemstones.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="ri-lookup"
          label="Refractive Index"
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

        <FormField
          name="ri-tolerance"
          label="Tolerance (±)"
        >
          <Select
            options={TOLERANCE_OPTIONS}
            value={values.tolerance}
            onChange={(v) => setValue('tolerance', v)}
          />
        </FormField>
      </div>

      {result !== null && (
        <div className="space-y-3">
          {matches.length > 0 ? (
            <GemMatchList
              gems={matches}
              matchedProperty="ri"
              label="Matching Gemstones"
              layout="list"
            />
          ) : (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              No common gems found with RI {values.ri} (±{values.tolerance}). Try widening the tolerance or
              checking your reading.
            </div>
          )}
        </div>
      )}

      {/* Reference table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b">
          <h4 className="text-sm font-medium text-slate-700">Common Gem RI Reference</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-slate-700">Gem</th>
                <th className="px-4 py-2 text-left text-slate-700">RI</th>
                <th className="px-4 py-2 text-left text-slate-700">SG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fallbackGems.map(gem => (
                <tr key={gem.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-900">{gem.name}</td>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">{formatRI(gem.ri)}</td>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">{formatSG(gem.sg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

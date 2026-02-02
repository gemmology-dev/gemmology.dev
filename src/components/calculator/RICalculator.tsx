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
import { Table } from '../ui';

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
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Common Gem RI Reference</h4>
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

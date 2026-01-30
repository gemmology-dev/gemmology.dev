/**
 * Carat Weight Estimator component.
 * Estimates carat weight from stone dimensions and specific gravity.
 * Uses database for shape factors and SG presets when available.
 */

import { useState, useMemo } from 'react';
import { SHAPE_FACTORS } from '../../lib/calculator/conversions';
import { useCalculatorData } from '../../hooks/useCalculatorData';
import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { validateNumber } from './ValidationMessage';
import { FormField, NumberInput, Select } from '../form';
import { MultiValueResult } from './results';

type Shape = keyof typeof SHAPE_FACTORS;

// Fallback shape options (used when database not available)
const FALLBACK_SHAPES: { value: Shape; label: string }[] = [
  { value: 'round-brilliant', label: 'Round Brilliant' },
  { value: 'oval', label: 'Oval' },
  { value: 'pear', label: 'Pear' },
  { value: 'marquise', label: 'Marquise' },
  { value: 'emerald-cut', label: 'Emerald Cut' },
  { value: 'cushion', label: 'Cushion' },
  { value: 'princess', label: 'Princess' },
  { value: 'heart', label: 'Heart' },
  { value: 'radiant', label: 'Radiant' },
];

// Fallback SG presets (used when database not available)
const FALLBACK_SG = [
  { label: 'Diamond (3.52)', value: '3.52' },
  { label: 'Ruby/Sapphire (4.00)', value: '4.00' },
  { label: 'Emerald (2.72)', value: '2.72' },
  { label: 'Spinel (3.60)', value: '3.60' },
  { label: 'Aquamarine (2.71)', value: '2.71' },
  { label: 'Topaz (3.53)', value: '3.53' },
  { label: 'Tourmaline (3.10)', value: '3.10' },
  { label: 'Quartz (2.65)', value: '2.65' },
  { label: 'Zircon (4.70)', value: '4.70' },
  { label: 'Tanzanite (3.35)', value: '3.35' },
];

export function CaratEstimator() {
  const [sgSource, setSgSource] = useState<'preset' | 'custom'>('preset');
  const [sgCustom, setSgCustom] = useState('');

  const { shapeFactors, mineralsWithSG, fallbackShapeFactors } = useCalculatorData();

  // Use database shape factors if available, otherwise fallback
  const shapes = useMemo(() => {
    if (shapeFactors.length > 0) {
      return shapeFactors.map(sf => ({
        value: sf.id as Shape,
        label: sf.name,
        factor: sf.factor,
      }));
    }
    return FALLBACK_SHAPES.map(s => ({
      ...s,
      factor: fallbackShapeFactors[s.value],
    }));
  }, [shapeFactors, fallbackShapeFactors]);

  // Use database SG presets if available, otherwise fallback
  const sgOptions = useMemo(() => {
    if (mineralsWithSG.length > 0) {
      const sorted = [...mineralsWithSG]
        .filter(m => m.sg_min && m.sg_max)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 15);

      return sorted.map(m => {
        const sgValue = m.sg_min === m.sg_max
          ? m.sg_min!
          : (m.sg_min! + m.sg_max!) / 2;
        return {
          label: `${m.name} (${sgValue.toFixed(2)})`,
          value: sgValue.toString(),
        };
      });
    }
    return FALLBACK_SG;
  }, [mineralsWithSG]);

  const { values, errors, result, setValue } = useCalculatorForm({
    fields: {
      length: {
        validate: (v) => validateNumber(v, { positive: true, label: 'Length' }),
        parse: parseFloat,
      },
      width: {
        validate: (v) => validateNumber(v, { positive: true, label: 'Width' }),
        parse: parseFloat,
      },
      depth: {
        validate: (v) => validateNumber(v, { positive: true, label: 'Depth' }),
        parse: parseFloat,
      },
      shape: {
        initialValue: 'round-brilliant',
        required: false,
      },
      sgPreset: {
        initialValue: '3.52',
        parse: parseFloat,
        required: false,
      },
    },
    compute: ({ length, width, depth, sgPreset }) => {
      if (length === undefined || width === undefined || depth === undefined) return null;
      const sgValue = sgSource === 'custom' ? parseFloat(sgCustom) : sgPreset;
      if (!sgValue || isNaN(sgValue) || sgValue <= 0) return null;

      const shape = values.shape as Shape;
      const dbFactor = shapes.find(s => s.value === shape);
      const factor = dbFactor?.factor ?? fallbackShapeFactors[shape] ?? 0.0061;
      const carats = length * width * depth * sgValue * factor;

      return { carats, factor, grams: carats * 0.2 };
    },
  });

  // Custom SG validation
  const sgError = sgSource === 'custom' && sgCustom
    ? validateNumber(sgCustom, { positive: true, min: 1, max: 10, label: 'Specific gravity' })
    : null;

  const handleSgSelectChange = (value: string) => {
    if (value === 'custom') {
      setSgSource('custom');
    } else {
      setSgSource('preset');
      setValue('sgPreset', value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter stone dimensions to estimate carat weight.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: Weight = L × W × D × SG × Shape Factor
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField name="dim-length" label="Length" unit="mm" error={errors.length}>
          <NumberInput
            value={values.length}
            onChange={(v) => setValue('length', v)}
            min={0}
            step={0.1}
            placeholder="e.g., 6.5"
          />
        </FormField>

        <FormField name="dim-width" label="Width" unit="mm" error={errors.width}>
          <NumberInput
            value={values.width}
            onChange={(v) => setValue('width', v)}
            min={0}
            step={0.1}
            placeholder="e.g., 6.5"
          />
        </FormField>

        <FormField name="dim-depth" label="Depth" unit="mm" error={errors.depth}>
          <NumberInput
            value={values.depth}
            onChange={(v) => setValue('depth', v)}
            min={0}
            step={0.1}
            placeholder="e.g., 4.0"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField name="shape-select" label="Shape">
          <Select
            options={shapes.map(s => ({ value: s.value, label: s.label }))}
            value={values.shape}
            onChange={(v) => setValue('shape', v)}
          />
        </FormField>

        <div className="space-y-1">
          <FormField name="sg-select" label="Specific Gravity" error={sgError}>
            <Select
              options={[
                ...sgOptions,
                { value: 'custom', label: 'Custom SG...' },
              ]}
              value={sgSource === 'custom' ? 'custom' : values.sgPreset}
              onChange={handleSgSelectChange}
            />
          </FormField>
          {sgSource === 'custom' && (
            <NumberInput
              value={sgCustom}
              onChange={setSgCustom}
              min={1}
              max={10}
              step={0.01}
              placeholder="Enter custom SG (e.g., 3.50)"
              hasError={!!sgError}
            />
          )}
        </div>
      </div>

      {result && (
        <MultiValueResult
          results={[
            { value: result.carats, precision: 2, unit: 'ct', label: 'Estimated Weight', primary: true },
            { value: result.grams, precision: 3, unit: 'g', label: 'Weight in Grams' },
            { value: result.factor, precision: 4, label: 'Shape Factor' },
          ]}
          layout="horizontal"
        />
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Note:</strong> These are estimates. Actual weight varies with exact proportions, girdle thickness, and cut quality.</p>
        <p><strong>Example (1ct diamond):</strong> 6.5 × 6.5 × 4.0 mm, SG 3.52, Round = ~1.0 ct</p>
      </div>
    </div>
  );
}

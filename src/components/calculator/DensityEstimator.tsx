/**
 * Density Estimator
 * Alternative SG calculation for irregular shapes using volume estimation
 */

import { useState, useMemo } from 'react';
import { validateNumber } from './ValidationMessage';
import { FormField, NumberInput, Select } from '../form';
import { NumberResult } from './results';

const VOLUME_METHODS = [
  { value: 'displacement', label: 'Water Displacement' },
  { value: 'geometric', label: 'Geometric Approximation' },
  { value: 'direct', label: 'Direct Volume Input' },
];

const METHOD_DESCRIPTIONS: Record<string, string> = {
  displacement: 'Volume from water displacement',
  geometric: 'L × W × H × shape factor',
  direct: 'Enter measured volume',
};

const SHAPE_FACTORS = [
  { value: '0.5236', label: 'Sphere (factor: 0.5236)' },
  { value: '0.5236', label: 'Ellipsoid (factor: 0.5236)' },
  { value: '1.0', label: 'Cube/Block (factor: 1.0)' },
  { value: '0.65', label: 'Irregular (est.) (factor: 0.65)' },
];

export function DensityEstimator() {
  const [method, setMethod] = useState('displacement');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shapeFactor, setShapeFactor] = useState('0.65');

  // Validation with eager feedback
  const weightError = weight ? validateNumber(weight, { positive: true, min: 0.01, max: 1000, label: 'Weight' }) : null;
  const volumeError = volume ? validateNumber(volume, { positive: true, min: 0.01, max: 1000, label: 'Volume' }) : null;
  const lengthError = length ? validateNumber(length, { positive: true, min: 0.01, max: 100, label: 'Length' }) : null;
  const widthError = width ? validateNumber(width, { positive: true, min: 0.01, max: 100, label: 'Width' }) : null;
  const heightError = height ? validateNumber(height, { positive: true, min: 0.01, max: 100, label: 'Height' }) : null;

  const result = useMemo(() => {
    const weightNum = parseFloat(weight);
    const volumeNum = parseFloat(volume);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const factorNum = parseFloat(shapeFactor);

    if (isNaN(weightNum) || weightNum <= 0 || weightError) return null;

    let calculatedVolume: number | null = null;

    if (method === 'direct' || method === 'displacement') {
      if (!isNaN(volumeNum) && volumeNum > 0 && !volumeError) {
        calculatedVolume = volumeNum;
      }
    } else if (method === 'geometric') {
      if (
        !isNaN(lengthNum) && lengthNum > 0 && !lengthError &&
        !isNaN(widthNum) && widthNum > 0 && !widthError &&
        !isNaN(heightNum) && heightNum > 0 && !heightError &&
        !isNaN(factorNum) && factorNum > 0
      ) {
        // Convert mm³ to cm³ (divide by 1000)
        calculatedVolume = (lengthNum * widthNum * heightNum * factorNum) / 1000;
      }
    }

    if (calculatedVolume === null || calculatedVolume <= 0) return null;

    return {
      density: weightNum / calculatedVolume,
      calculatedVolume,
    };
  }, [weight, volume, length, width, height, shapeFactor, method, weightError, volumeError, lengthError, widthError, heightError]);

  const hasAnyInput = weight || volume || length || width || height;
  const needsMoreInput = hasAnyInput && !result && !weightError && !volumeError && !lengthError && !widthError && !heightError;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Calculate density (SG) for irregular or fragile stones using volume estimation methods.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          <strong>Formula:</strong> Density = Weight ÷ Volume
        </p>
      </div>

      <FormField name="method" label="Volume Measurement Method" hint={METHOD_DESCRIPTIONS[method]}>
        <Select
          options={VOLUME_METHODS}
          value={method}
          onChange={setMethod}
        />
      </FormField>

      <FormField name="weight" label="Weight" unit="g" error={weightError}>
        <NumberInput
          value={weight}
          onChange={setWeight}
          min={0}
          step={0.001}
          placeholder="e.g., 3.52"
        />
      </FormField>

      {method === 'direct' && (
        <FormField name="volume" label="Volume" unit="cm³" error={volumeError}>
          <NumberInput
            value={volume}
            onChange={setVolume}
            min={0}
            step={0.001}
            placeholder="e.g., 1.0"
          />
        </FormField>
      )}

      {method === 'displacement' && (
        <FormField
          name="displacement"
          label="Water Displaced"
          unit="cm³ or mL"
          error={volumeError}
          hint="Submerge stone in graduated cylinder and measure volume change"
        >
          <NumberInput
            value={volume}
            onChange={setVolume}
            min={0}
            step={0.001}
            placeholder="e.g., 1.0"
          />
        </FormField>
      )}

      {method === 'geometric' && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <FormField name="length" label="Length" unit="mm" error={lengthError}>
              <NumberInput
                value={length}
                onChange={setLength}
                min={0}
                step={0.01}
                placeholder="e.g., 6.5"
              />
            </FormField>
            <FormField name="width" label="Width" unit="mm" error={widthError}>
              <NumberInput
                value={width}
                onChange={setWidth}
                min={0}
                step={0.01}
                placeholder="e.g., 6.5"
              />
            </FormField>
            <FormField name="height" label="Height" unit="mm" error={heightError}>
              <NumberInput
                value={height}
                onChange={setHeight}
                min={0}
                step={0.01}
                placeholder="e.g., 4.0"
              />
            </FormField>
          </div>

          <FormField
            name="shape"
            label="Shape Approximation"
            hint={`Volume = L × W × H × ${shapeFactor} (in mm³, converted to cm³)`}
          >
            <Select
              options={SHAPE_FACTORS}
              value={shapeFactor}
              onChange={setShapeFactor}
            />
          </FormField>

          {result && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <strong>Calculated Volume:</strong> {result.calculatedVolume.toFixed(3)} cm³
            </div>
          )}
        </>
      )}

      {needsMoreInput && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Enter weight and {method === 'geometric' ? 'all dimensions' : 'volume'} to calculate density.
        </div>
      )}

      {result && (
        <NumberResult
          value={result.density}
          precision={3}
          label="Estimated Specific Gravity"
          variant="emerald"
          description="This is an estimate. Actual SG from hydrostatic weighing is more accurate."
        />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">When to Use This Tool</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Fragile or porous stones that can't be submerged</li>
          <li>• Irregular rough specimens without standard shapes</li>
          <li>• Quick field estimates when lab equipment isn't available</li>
          <li>• Large specimens too big for standard SG equipment</li>
        </ul>
      </div>
    </div>
  );
}

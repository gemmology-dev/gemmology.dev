/**
 * Density Estimator
 * Alternative SG calculation for irregular shapes using volume estimation
 */

import { useState } from 'react';
import { ResultCard } from './ResultCard';
import { ValidationMessage, validateNumber } from './ValidationMessage';

const VOLUME_METHODS = [
  { id: 'displacement', label: 'Water Displacement', formula: 'Volume from water displacement' },
  { id: 'geometric', label: 'Geometric Approximation', formula: 'L × W × H × shape factor' },
  { id: 'direct', label: 'Direct Volume Input', formula: 'Enter measured volume' },
];

const SHAPE_FACTORS = [
  { id: 'sphere', label: 'Sphere', factor: 0.5236 }, // (4/3)π/8
  { id: 'ellipsoid', label: 'Ellipsoid', factor: 0.5236 },
  { id: 'cube', label: 'Cube/Block', factor: 1.0 },
  { id: 'irregular', label: 'Irregular (est.)', factor: 0.65 },
];

export function DensityEstimator() {
  const [method, setMethod] = useState('displacement');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shapeFactor, setShapeFactor] = useState('0.65');
  const [touched, setTouched] = useState({
    weight: false,
    volume: false,
    length: false,
    width: false,
    height: false,
  });

  // Validation - pass strings to validators
  const weightError = touched.weight
    ? validateNumber(weight, { positive: true, min: 0.01, max: 1000, label: 'Weight' })
    : null;
  const volumeError = touched.volume
    ? validateNumber(volume, { positive: true, min: 0.01, max: 1000, label: 'Volume' })
    : null;
  const lengthError = touched.length
    ? validateNumber(length, { positive: true, min: 0.01, max: 100, label: 'Length' })
    : null;
  const widthError = touched.width
    ? validateNumber(width, { positive: true, min: 0.01, max: 100, label: 'Width' })
    : null;
  const heightError = touched.height
    ? validateNumber(height, { positive: true, min: 0.01, max: 100, label: 'Height' })
    : null;

  const weightNum = parseFloat(weight);
  const volumeNum = parseFloat(volume);
  const lengthNum = parseFloat(length);
  const widthNum = parseFloat(width);
  const heightNum = parseFloat(height);
  const factorNum = parseFloat(shapeFactor);

  const isValidWeight = !weightError && !isNaN(weightNum) && weightNum > 0;

  let calculatedVolume: number | null = null;
  let density: number | null = null;

  if (method === 'direct' && !volumeError && !isNaN(volumeNum) && volumeNum > 0) {
    calculatedVolume = volumeNum;
  } else if (method === 'displacement' && !volumeError && !isNaN(volumeNum) && volumeNum > 0) {
    calculatedVolume = volumeNum;
  } else if (
    method === 'geometric' &&
    !lengthError && !widthError && !heightError &&
    !isNaN(lengthNum) && lengthNum > 0 &&
    !isNaN(widthNum) && widthNum > 0 &&
    !isNaN(heightNum) && heightNum > 0 &&
    !isNaN(factorNum) && factorNum > 0
  ) {
    calculatedVolume = lengthNum * widthNum * heightNum * factorNum;
  }

  if (isValidWeight && calculatedVolume !== null && calculatedVolume > 0) {
    density = weightNum / calculatedVolume;
  }

  // Check if we should show a hint
  const hasAnyInput = weight || volume || length || width || height;
  const needsMoreInput = hasAnyInput && density === null && !weightError && !volumeError && !lengthError && !widthError && !heightError;

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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Volume Measurement Method
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
        >
          {VOLUME_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          {VOLUME_METHODS.find((m) => m.id === method)?.formula}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Weight (g)
        </label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, weight: true }))}
          aria-invalid={!!weightError}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${weightError ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="e.g., 3.52"
        />
        <ValidationMessage message={weightError || ''} visible={!!weightError} />
      </div>

      {method === 'direct' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Volume (cm³)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, volume: true }))}
            aria-invalid={!!volumeError}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${volumeError ? 'border-red-300' : 'border-slate-300'}`}
            placeholder="e.g., 1.0"
          />
          <ValidationMessage message={volumeError || ''} visible={!!volumeError} />
        </div>
      )}

      {method === 'displacement' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Water Displaced (cm³ or mL)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, volume: true }))}
            aria-invalid={!!volumeError}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${volumeError ? 'border-red-300' : 'border-slate-300'}`}
            placeholder="e.g., 1.0"
          />
          <p className="text-xs text-slate-500 mt-1">
            Submerge stone in graduated cylinder and measure volume change
          </p>
          <ValidationMessage message={volumeError || ''} visible={!!volumeError} />
        </div>
      )}

      {method === 'geometric' && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Length (mm)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, length: true }))}
                aria-invalid={!!lengthError}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${lengthError ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="e.g., 6.5"
              />
              <ValidationMessage message={lengthError || ''} visible={!!lengthError} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Width (mm)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, width: true }))}
                aria-invalid={!!widthError}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${widthError ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="e.g., 6.5"
              />
              <ValidationMessage message={widthError || ''} visible={!!widthError} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Height (mm)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, height: true }))}
                aria-invalid={!!heightError}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${heightError ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="e.g., 4.0"
              />
              <ValidationMessage message={heightError || ''} visible={!!heightError} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shape Approximation
            </label>
            <select
              value={shapeFactor}
              onChange={(e) => setShapeFactor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            >
              {SHAPE_FACTORS.map((s) => (
                <option key={s.id} value={s.factor}>
                  {s.label} (factor: {s.factor})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Volume = L × W × H × {factorNum} (in mm³, converted to cm³)
            </p>
          </div>

          {calculatedVolume !== null && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <strong>Calculated Volume:</strong> {calculatedVolume.toFixed(3)} cm³
            </div>
          )}
        </>
      )}

      {/* Hint when inputs are incomplete */}
      {needsMoreInput && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Enter weight and {method === 'geometric' ? 'all dimensions' : 'volume'} to calculate density.
        </div>
      )}

      {density !== null && (
        <ResultCard
          value={density.toFixed(3)}
          label="Estimated Specific Gravity"
          variant="emerald"
        >
          <p className="text-sm text-slate-600 mt-2">
            <strong>Note:</strong> This is an estimate. Actual SG from hydrostatic weighing is more accurate.
          </p>
        </ResultCard>
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

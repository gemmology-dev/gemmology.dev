/**
 * Carat Weight Estimator component.
 * Estimates carat weight from stone dimensions and specific gravity.
 * Uses database for shape factors and SG presets when available.
 */

import { useState, useMemo } from 'react';
import { SHAPE_FACTORS } from '../../lib/calculator/conversions';
import { useCalculatorData } from '../../hooks/useCalculatorData';

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
  { label: 'Diamond (3.52)', value: 3.52 },
  { label: 'Ruby/Sapphire (4.00)', value: 4.00 },
  { label: 'Emerald (2.72)', value: 2.72 },
  { label: 'Spinel (3.60)', value: 3.60 },
  { label: 'Aquamarine (2.71)', value: 2.71 },
  { label: 'Topaz (3.53)', value: 3.53 },
  { label: 'Tourmaline (3.10)', value: 3.10 },
  { label: 'Quartz (2.65)', value: 2.65 },
  { label: 'Zircon (4.70)', value: 4.70 },
  { label: 'Tanzanite (3.35)', value: 3.35 },
];

export function CaratEstimator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [sgSource, setSgSource] = useState<'preset' | 'custom'>('preset');
  const [sgPreset, setSgPreset] = useState('3.52');
  const [sgCustom, setSgCustom] = useState('');
  const [shape, setShape] = useState<Shape>('round-brilliant');

  const { shapeFactors, mineralsWithSG, dbAvailable, fallbackShapeFactors } = useCalculatorData();

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
      // Get unique minerals with SG, sorted by name
      const sorted = [...mineralsWithSG]
        .filter(m => m.sg_min && m.sg_max)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 15); // Limit to 15 most common

      return sorted.map(m => {
        const sgValue = m.sg_min === m.sg_max
          ? m.sg_min!
          : (m.sg_min! + m.sg_max!) / 2;
        return {
          label: `${m.name} (${sgValue.toFixed(2)})`,
          value: sgValue,
        };
      });
    }
    return FALLBACK_SG;
  }, [mineralsWithSG]);

  // Get the effective SG value
  const sg = sgSource === 'custom' ? sgCustom : sgPreset;

  // Get shape factor from database or fallback
  const getShapeFactor = (shapeId: Shape): number => {
    const dbFactor = shapes.find(s => s.value === shapeId);
    return dbFactor?.factor ?? fallbackShapeFactors[shapeId] ?? 0.0061;
  };

  const result = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const d = parseFloat(depth);
    const sgValue = parseFloat(sg);

    if (isNaN(l) || isNaN(w) || isNaN(d) || isNaN(sgValue)) {
      return null;
    }

    if (l <= 0 || w <= 0 || d <= 0 || sgValue <= 0) {
      return null;
    }

    // Calculate carat weight: L × W × D × SG × Shape Factor
    const factor = getShapeFactor(shape);
    const carats = l * w * d * sgValue * factor;
    return { carats, factor };
  }, [length, width, depth, sg, shape, shapes]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter stone dimensions to estimate carat weight.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: Weight = L × W × D × SG × Shape Factor
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="dim-length" className="block text-sm font-medium text-slate-700 mb-1">
            Length (mm)
          </label>
          <input
            id="dim-length"
            type="number"
            step="0.1"
            min="0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g., 6.5"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
        </div>

        <div>
          <label htmlFor="dim-width" className="block text-sm font-medium text-slate-700 mb-1">
            Width (mm)
          </label>
          <input
            id="dim-width"
            type="number"
            step="0.1"
            min="0"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="e.g., 6.5"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
        </div>

        <div>
          <label htmlFor="dim-depth" className="block text-sm font-medium text-slate-700 mb-1">
            Depth (mm)
          </label>
          <input
            id="dim-depth"
            type="number"
            step="0.1"
            min="0"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            placeholder="e.g., 4.0"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="shape-select" className="block text-sm font-medium text-slate-700 mb-1">
            Shape
          </label>
          <select
            id="shape-select"
            value={shape}
            onChange={(e) => setShape(e.target.value as Shape)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          >
            {shapes.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sg-select" className="block text-sm font-medium text-slate-700 mb-1">
            Specific Gravity
          </label>
          <select
            id="sg-select"
            value={sgSource === 'custom' ? 'custom' : sgPreset}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setSgSource('custom');
              } else {
                setSgSource('preset');
                setSgPreset(e.target.value);
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          >
            {sgOptions.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
            <option value="custom">Custom SG...</option>
          </select>
          {/* Custom SG input - only shown when "Custom" is selected */}
          {sgSource === 'custom' && (
            <input
              type="number"
              step="0.01"
              min="1"
              max="10"
              value={sgCustom}
              onChange={(e) => setSgCustom(e.target.value)}
              placeholder="Enter custom SG (e.g., 3.50)"
              aria-label="Custom specific gravity value"
              autoFocus
              className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-sm"
            />
          )}
        </div>
      </div>

      {result && (
        <div className="p-4 rounded-lg bg-crystal-50 border border-crystal-200">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Estimated Weight
              {dbAvailable && <span className="ml-1 text-xs text-green-600">(DB)</span>}
            </p>
            <p className="text-3xl font-bold text-crystal-700">{result.carats.toFixed(2)} ct</p>
            <p className="text-xs text-slate-500 mt-1">
              ({(result.carats * 0.2).toFixed(3)} grams)
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Shape factor: {result.factor.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Note:</strong> These are estimates. Actual weight varies with exact proportions, girdle thickness, and cut quality.</p>
        <p><strong>Example (1ct diamond):</strong> 6.5 × 6.5 × 4.0 mm, SG 3.52, Round = ~1.0 ct</p>
      </div>
    </div>
  );
}

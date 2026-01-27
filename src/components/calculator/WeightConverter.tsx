/**
 * Weight Converter component.
 * Converts between carat, gram, and milligram.
 */

import { useState, useCallback } from 'react';
import {
  caratToGram,
  gramToCarat,
  caratToMilligram,
  milligramToCarat,
  gramToMilligram,
  milligramToGram,
} from '../../lib/calculator/conversions';

type Unit = 'carat' | 'gram' | 'milligram';

export function WeightConverter() {
  const [carat, setCarat] = useState('');
  const [gram, setGram] = useState('');
  const [milligram, setMilligram] = useState('');
  const [lastEdited, setLastEdited] = useState<Unit | null>(null);

  const updateFromCarat = useCallback((value: string) => {
    setCarat(value);
    setLastEdited('carat');
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setGram(caratToGram(num).toFixed(4));
      setMilligram(caratToMilligram(num).toFixed(2));
    } else {
      setGram('');
      setMilligram('');
    }
  }, []);

  const updateFromGram = useCallback((value: string) => {
    setGram(value);
    setLastEdited('gram');
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setCarat(gramToCarat(num).toFixed(4));
      setMilligram(gramToMilligram(num).toFixed(2));
    } else {
      setCarat('');
      setMilligram('');
    }
  }, []);

  const updateFromMilligram = useCallback((value: string) => {
    setMilligram(value);
    setLastEdited('milligram');
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setCarat(milligramToCarat(num).toFixed(4));
      setGram(milligramToGram(num).toFixed(4));
    } else {
      setCarat('');
      setGram('');
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter a value in any field to convert between weight units.</p>
        <p className="mt-2 text-xs text-slate-500">
          1 carat = 0.2 grams = 200 milligrams
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="weight-carat" className="block text-sm font-medium text-slate-700 mb-1">
            Carats (ct)
          </label>
          <input
            id="weight-carat"
            type="number"
            step="0.01"
            min="0"
            value={carat}
            onChange={(e) => updateFromCarat(e.target.value)}
            placeholder="e.g., 1.00"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>

        <div>
          <label htmlFor="weight-gram" className="block text-sm font-medium text-slate-700 mb-1">
            Grams (g)
          </label>
          <input
            id="weight-gram"
            type="number"
            step="0.0001"
            min="0"
            value={gram}
            onChange={(e) => updateFromGram(e.target.value)}
            placeholder="e.g., 0.20"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>

        <div>
          <label htmlFor="weight-mg" className="block text-sm font-medium text-slate-700 mb-1">
            Milligrams (mg)
          </label>
          <input
            id="weight-mg"
            type="number"
            step="1"
            min="0"
            value={milligram}
            onChange={(e) => updateFromMilligram(e.target.value)}
            placeholder="e.g., 200"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Common weights:</strong></p>
        <p>• 1 carat engagement diamond ≈ 0.2g</p>
        <p>• 5 carat sapphire ≈ 1.0g</p>
        <p>• Melee diamonds are typically 0.01-0.20 ct (2-40 mg)</p>
      </div>
    </div>
  );
}

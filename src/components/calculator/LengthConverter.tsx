/**
 * Length Converter component.
 * Converts between millimeters and inches.
 */

import { useState, useCallback } from 'react';
import { mmToInch, inchToMm } from '../../lib/calculator/conversions';

export function LengthConverter() {
  const [mm, setMm] = useState('');
  const [inches, setInches] = useState('');

  const updateFromMm = useCallback((value: string) => {
    setMm(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInches(mmToInch(num).toFixed(4));
    } else {
      setInches('');
    }
  }, []);

  const updateFromInches = useCallback((value: string) => {
    setInches(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setMm(inchToMm(num).toFixed(2));
    } else {
      setMm('');
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter a value in either field to convert between length units.</p>
        <p className="mt-2 text-xs text-slate-500">
          1 inch = 25.4 mm
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="length-mm" className="block text-sm font-medium text-slate-700 mb-1">
            Millimeters (mm)
          </label>
          <input
            id="length-mm"
            type="number"
            step="0.01"
            min="0"
            value={mm}
            onChange={(e) => updateFromMm(e.target.value)}
            placeholder="e.g., 6.5"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>

        <div>
          <label htmlFor="length-inch" className="block text-sm font-medium text-slate-700 mb-1">
            Inches (in)
          </label>
          <input
            id="length-inch"
            type="number"
            step="0.0001"
            min="0"
            value={inches}
            onChange={(e) => updateFromInches(e.target.value)}
            placeholder="e.g., 0.25"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Common stone sizes:</strong></p>
        <p>• 6.5mm round ≈ 1 carat diamond</p>
        <p>• 7mm round ≈ 1.25 carat diamond</p>
        <p>• 8mm round ≈ 2 carat diamond</p>
        <p>• Ring sizes typically 16-20mm diameter</p>
      </div>
    </div>
  );
}

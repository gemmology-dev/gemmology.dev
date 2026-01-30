/**
 * Length Converter component.
 * Converts between millimeters and inches.
 */

import { useState, useCallback } from 'react';
import { mmToInch, inchToMm } from '../../lib/calculator/conversions';
import { ValidationMessage } from './ValidationMessage';

type Unit = 'mm' | 'inches';

export function LengthConverter() {
  const [mm, setMm] = useState('');
  const [inches, setInches] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastEdited, setLastEdited] = useState<Unit | null>(null);

  const validateAndConvert = (value: string): boolean => {
    if (!value) {
      setError(null);
      return false;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return false;
    }
    if (num < 0) {
      setError('Length cannot be negative');
      return false;
    }
    setError(null);
    return true;
  };

  const updateFromMm = useCallback((value: string) => {
    setMm(value);
    setLastEdited('mm');
    if (validateAndConvert(value)) {
      const num = parseFloat(value);
      setInches(mmToInch(num).toFixed(4));
    } else if (!value) {
      setInches('');
    }
  }, []);

  const updateFromInches = useCallback((value: string) => {
    setInches(value);
    setLastEdited('inches');
    if (validateAndConvert(value)) {
      const num = parseFloat(value);
      setMm(inchToMm(num).toFixed(2));
    } else if (!value) {
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

      {/* Error message */}
      <ValidationMessage message={error || ''} visible={!!error} />

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
            aria-invalid={!!error && lastEdited === 'mm'}
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg ${error && lastEdited === 'mm' ? 'border-red-300' : 'border-slate-300'}`}
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
            aria-invalid={!!error && lastEdited === 'inches'}
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg ${error && lastEdited === 'inches' ? 'border-red-300' : 'border-slate-300'}`}
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

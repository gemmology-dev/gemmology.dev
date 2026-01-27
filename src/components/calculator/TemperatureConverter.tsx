/**
 * Temperature Converter component.
 * Converts between Celsius and Fahrenheit.
 * Useful for understanding heat treatment temperatures.
 */

import { useState, useCallback } from 'react';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../../lib/calculator/conversions';

export function TemperatureConverter() {
  const [celsius, setCelsius] = useState('');
  const [fahrenheit, setFahrenheit] = useState('');

  const updateFromCelsius = useCallback((value: string) => {
    setCelsius(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setFahrenheit(celsiusToFahrenheit(num).toFixed(1));
    } else {
      setFahrenheit('');
    }
  }, []);

  const updateFromFahrenheit = useCallback((value: string) => {
    setFahrenheit(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setCelsius(fahrenheitToCelsius(num).toFixed(1));
    } else {
      setCelsius('');
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter a value in either field to convert between temperature units.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: °F = (°C × 9/5) + 32
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="temp-celsius" className="block text-sm font-medium text-slate-700 mb-1">
            Celsius (°C)
          </label>
          <input
            id="temp-celsius"
            type="number"
            step="1"
            value={celsius}
            onChange={(e) => updateFromCelsius(e.target.value)}
            placeholder="e.g., 1800"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>

        <div>
          <label htmlFor="temp-fahrenheit" className="block text-sm font-medium text-slate-700 mb-1">
            Fahrenheit (°F)
          </label>
          <input
            id="temp-fahrenheit"
            type="number"
            step="1"
            value={fahrenheit}
            onChange={(e) => updateFromFahrenheit(e.target.value)}
            placeholder="e.g., 3272"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 text-lg"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Heat Treatment Temperatures</h4>
        <div className="text-xs text-slate-600 space-y-1">
          <p>• <strong>Corundum:</strong> 1200-1800°C (2192-3272°F)</p>
          <p>• <strong>Tanzanite:</strong> 550-700°C (1022-1292°F)</p>
          <p>• <strong>Aquamarine:</strong> 400-450°C (752-842°F)</p>
          <p>• <strong>Citrine (from amethyst):</strong> 470-560°C (878-1040°F)</p>
          <p>• <strong>Zircon:</strong> 900-1000°C (1652-1832°F)</p>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        <p><strong>Note:</strong> Heat treatment temperatures are approximate and depend on specific conditions including atmosphere, duration, and starting material.</p>
      </div>
    </div>
  );
}

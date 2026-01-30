/**
 * Temperature Converter component.
 * Converts between Celsius and Fahrenheit using bidirectional sync.
 * Useful for understanding heat treatment temperatures.
 */

import { useBidirectionalConversion } from '../../hooks/useBidirectionalConversion';
import { FormField, NumberInput } from '../form';
import { FieldError } from '../form/FieldError';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../../lib/calculator/conversions';

type TempUnit = 'celsius' | 'fahrenheit';

const UNITS = [
  { key: 'celsius' as const, decimals: 1, min: -273.15 },
  { key: 'fahrenheit' as const, decimals: 1, min: -459.67 },
] as const;

function convert(value: number, from: TempUnit, to: TempUnit): number {
  if (from === to) return value;
  if (from === 'celsius') return celsiusToFahrenheit(value);
  return fahrenheitToCelsius(value);
}

export function TemperatureConverter() {
  const { values, error, lastEdited, setValue } = useBidirectionalConversion({
    units: UNITS,
    convert,
    validate: (value, unit) => {
      const minTemp = unit === 'celsius' ? -273.15 : -459.67;
      const unitLabel = unit === 'celsius' ? '°C' : '°F';
      if (value < minTemp) {
        return `Temperature cannot be below absolute zero (${minTemp}${unitLabel})`;
      }
      return null;
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter a value in either field to convert between temperature units.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: °F = (°C × 9/5) + 32
        </p>
      </div>

      {/* Shared error message */}
      {error && <FieldError message={error} />}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="temp-celsius"
          label="Celsius"
          unit="°C"
          error={lastEdited === 'celsius' ? error : null}
        >
          <NumberInput
            value={values.celsius}
            onChange={(v) => setValue('celsius', v)}
            step={1}
            placeholder="e.g., 1800"
            size="lg"
            allowNegative
          />
        </FormField>

        <FormField
          name="temp-fahrenheit"
          label="Fahrenheit"
          unit="°F"
          error={lastEdited === 'fahrenheit' ? error : null}
        >
          <NumberInput
            value={values.fahrenheit}
            onChange={(v) => setValue('fahrenheit', v)}
            step={1}
            placeholder="e.g., 3272"
            size="lg"
            allowNegative
          />
        </FormField>
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

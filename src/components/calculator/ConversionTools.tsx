/**
 * Unit Conversion tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { WeightConverter } from './WeightConverter';
import { LengthConverter } from './LengthConverter';
import { TemperatureConverter } from './TemperatureConverter';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  weight: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  ruler: 'M6 20h12M6 4h12m-6 0v16',
  thermometer: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

export function ConversionTools() {
  return (
    <div className="space-y-6">
      <ToolSection
        id="weight"
        title="Weight Converter"
        description="Convert between carats, grams, and milligrams"
        iconPath={ICON_PATHS.weight}
        accent="blue"
      >
        <WeightConverter />
      </ToolSection>

      <ToolSection
        id="length"
        title="Length Converter"
        description="Convert between millimeters and inches"
        iconPath={ICON_PATHS.ruler}
        accent="blue"
      >
        <LengthConverter />
      </ToolSection>

      <ToolSection
        id="temperature"
        title="Temperature Converter"
        description="Convert between Celsius and Fahrenheit"
        iconPath={ICON_PATHS.thermometer}
        accent="blue"
      >
        <TemperatureConverter />
      </ToolSection>
    </div>
  );
}

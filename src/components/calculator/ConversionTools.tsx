/**
 * Unit Conversion tools container.
 * Shows all conversion tools in expandable cards.
 */

import { useState } from 'react';
import { WeightConverter } from './WeightConverter';
import { LengthConverter } from './LengthConverter';
import { TemperatureConverter } from './TemperatureConverter';
import { PricePerCaratConverter } from './PricePerCaratConverter';
import { CalculatorCard } from './CalculatorCard';

type ConversionId = 'weight' | 'length' | 'temperature' | 'price';

interface ConversionConfig {
  id: ConversionId;
  label: string;
  iconPath: string;
  description: string;
  component: React.ReactNode;
}

const ICON_PATHS: Record<string, string> = {
  weight: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  ruler: 'M6 20h12M6 4h12m-6 0v16',
  thermometer: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const CONVERSIONS: ConversionConfig[] = [
  {
    id: 'weight',
    label: 'Weight Converter',
    iconPath: ICON_PATHS.weight,
    description: 'Convert ct/g/mg',
    component: <WeightConverter />,
  },
  {
    id: 'length',
    label: 'Length Converter',
    iconPath: ICON_PATHS.ruler,
    description: 'Convert mm/inches',
    component: <LengthConverter />,
  },
  {
    id: 'temperature',
    label: 'Temperature Converter',
    iconPath: ICON_PATHS.thermometer,
    description: 'Convert °C/°F',
    component: <TemperatureConverter />,
  },
  {
    id: 'price',
    label: 'Price Per Carat',
    iconPath: ICON_PATHS.currency,
    description: 'Calculate total price and markup',
    component: <PricePerCaratConverter />,
  },
];

interface ConversionToolsProps {
  defaultExpanded?: ConversionId | null;
}

export function ConversionTools({ defaultExpanded = 'weight' }: ConversionToolsProps) {
  const [expandedCalc, setExpandedCalc] = useState<ConversionId | null>(defaultExpanded);

  const handleToggle = (id: ConversionId) => {
    setExpandedCalc(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600 mb-4">
        <p>
          Unit conversion tools for weight, length, temperature, and pricing calculations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CONVERSIONS.map(calc => (
          <CalculatorCard
            key={calc.id}
            id={calc.id}
            title={calc.label}
            description={calc.description}
            iconPath={calc.iconPath}
            expanded={expandedCalc === calc.id}
            onToggle={() => handleToggle(calc.id)}
          >
            {calc.component}
          </CalculatorCard>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Tip: Click on any converter header to expand or collapse it.
      </p>
    </div>
  );
}

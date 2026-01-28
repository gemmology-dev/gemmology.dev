/**
 * Main Calculator component with grid layout.
 * Shows all gemmological calculators in expandable cards.
 */

import { useState, type ReactNode } from 'react';
import { SGCalculator } from './SGCalculator';
import { BirefringenceCalc } from './BirefringenceCalc';
import { CriticalAngleCalc } from './CriticalAngleCalc';
import { WeightConverter } from './WeightConverter';
import { LengthConverter } from './LengthConverter';
import { TemperatureConverter } from './TemperatureConverter';
import { CaratEstimator } from './CaratEstimator';
import { RICalculator } from './RICalculator';
import { CalculatorCard } from './CalculatorCard';

type CalculatorId =
  | 'sg'
  | 'ri-lookup'
  | 'birefringence'
  | 'critical-angle'
  | 'carat-estimate'
  | 'weight'
  | 'length'
  | 'temperature';

interface CalculatorConfig {
  id: CalculatorId;
  label: string;
  iconPath: string;
  description: string;
  component: ReactNode;
}

const ICON_PATHS: Record<string, string> = {
  scale: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  layers: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  'arrow-right': 'M13 7l5 5m0 0l-5 5m5-5H6',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  weight: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  ruler: 'M6 20h12M6 4h12m-6 0v16',
  thermometer: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

const CALCULATORS: CalculatorConfig[] = [
  {
    id: 'sg',
    label: 'Specific Gravity',
    iconPath: ICON_PATHS.scale,
    description: 'Calculate SG from hydrostatic weighing',
    component: <SGCalculator />,
  },
  {
    id: 'ri-lookup',
    label: 'RI Lookup',
    iconPath: ICON_PATHS.search,
    description: 'Find gems by refractive index',
    component: <RICalculator />,
  },
  {
    id: 'birefringence',
    label: 'Birefringence',
    iconPath: ICON_PATHS.layers,
    description: 'Calculate birefringence from RI values',
    component: <BirefringenceCalc />,
  },
  {
    id: 'critical-angle',
    label: 'Critical Angle',
    iconPath: ICON_PATHS['arrow-right'],
    description: 'Calculate TIR critical angle',
    component: <CriticalAngleCalc />,
  },
  {
    id: 'carat-estimate',
    label: 'Carat Estimate',
    iconPath: ICON_PATHS.cube,
    description: 'Estimate weight from dimensions',
    component: <CaratEstimator />,
  },
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
];

interface CalculatorProps {
  /** Default expanded calculator (null = none expanded) */
  defaultExpanded?: CalculatorId | null;
}

export function Calculator({ defaultExpanded = 'sg' }: CalculatorProps) {
  const [expandedCalc, setExpandedCalc] = useState<CalculatorId | null>(defaultExpanded);

  const handleToggle = (id: CalculatorId) => {
    setExpandedCalc(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-sm text-slate-600 mb-4">
        <p>
          Select a calculator below to expand it. These tools help with common gemmological
          calculations and conversions.
        </p>
      </div>

      {/* Calculator grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {CALCULATORS.map(calc => (
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

      {/* Tip */}
      <p className="text-xs text-slate-500 text-center">
        Tip: Click on any calculator header to expand or collapse it.
      </p>
    </div>
  );
}

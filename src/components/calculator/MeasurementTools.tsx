/**
 * Measurement & Calculation tools container.
 * Shows all measurement tools in expandable cards.
 */

import { useState } from 'react';
import { SGCalculator } from './SGCalculator';
import { RICalculator } from './RICalculator';
import { BirefringenceCalc } from './BirefringenceCalc';
import { CriticalAngleCalc } from './CriticalAngleCalc';
import { CaratEstimator } from './CaratEstimator';
import { DispersionCalculator } from './DispersionCalculator';
import { DensityEstimator } from './DensityEstimator';
import { CalculatorCard } from './CalculatorCard';

type MeasurementId =
  | 'sg'
  | 'ri-lookup'
  | 'birefringence'
  | 'critical-angle'
  | 'carat-estimate'
  | 'dispersion'
  | 'density';

interface MeasurementConfig {
  id: MeasurementId;
  label: string;
  iconPath: string;
  description: string;
  component: React.ReactNode;
}

const ICON_PATHS: Record<string, string> = {
  scale: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  layers: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  'arrow-right': 'M13 7l5 5m0 0l-5 5m5-5H6',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
};

const MEASUREMENTS: MeasurementConfig[] = [
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
    id: 'dispersion',
    label: 'Dispersion',
    iconPath: ICON_PATHS.sparkles,
    description: 'Calculate fire from RI at different wavelengths',
    component: <DispersionCalculator />,
  },
  {
    id: 'carat-estimate',
    label: 'Carat Estimate',
    iconPath: ICON_PATHS.cube,
    description: 'Estimate weight from dimensions',
    component: <CaratEstimator />,
  },
  {
    id: 'density',
    label: 'Density Estimator',
    iconPath: ICON_PATHS.beaker,
    description: 'Alternative SG for irregular shapes',
    component: <DensityEstimator />,
  },
];

interface MeasurementToolsProps {
  defaultExpanded?: MeasurementId | null;
}

export function MeasurementTools({ defaultExpanded = 'sg' }: MeasurementToolsProps) {
  const [expandedCalc, setExpandedCalc] = useState<MeasurementId | null>(defaultExpanded);

  const handleToggle = (id: MeasurementId) => {
    setExpandedCalc(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-sm text-slate-600 mb-4">
        <p>
          Select a tool below to expand it. These measurement and calculation tools help with gem identification, grading, and analysis.
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {MEASUREMENTS.map(calc => (
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
        Tip: Click on any tool header to expand or collapse it.
      </p>
    </div>
  );
}

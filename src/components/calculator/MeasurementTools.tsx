/**
 * Measurement & Calculation tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { SGCalculator } from './SGCalculator';
import { RICalculator } from './RICalculator';
import { BirefringenceCalc } from './BirefringenceCalc';
import { CriticalAngleCalc } from './CriticalAngleCalc';
import { CaratEstimator } from './CaratEstimator';
import { DispersionCalculator } from './DispersionCalculator';
import { DensityEstimator } from './DensityEstimator';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  scale: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  layers: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  'arrow-right': 'M13 7l5 5m0 0l-5 5m5-5H6',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
};

export function MeasurementTools() {
  return (
    <div className="space-y-6">
      <ToolSection
        id="sg"
        title="Specific Gravity"
        description="Calculate SG from hydrostatic weighing"
        iconPath={ICON_PATHS.scale}
        accent="emerald"
      >
        <SGCalculator />
      </ToolSection>

      <ToolSection
        id="ri-lookup"
        title="RI Lookup"
        description="Find gems by refractive index range"
        iconPath={ICON_PATHS.search}
        accent="emerald"
      >
        <RICalculator />
      </ToolSection>

      <ToolSection
        id="birefringence"
        title="Birefringence"
        description="Calculate birefringence from RI readings"
        iconPath={ICON_PATHS.layers}
        accent="emerald"
      >
        <BirefringenceCalc />
      </ToolSection>

      <ToolSection
        id="critical-angle"
        title="Critical Angle"
        description="Total internal reflection angle from RI"
        iconPath={ICON_PATHS['arrow-right']}
        accent="emerald"
      >
        <CriticalAngleCalc />
      </ToolSection>

      <ToolSection
        id="dispersion"
        title="Dispersion Calculator"
        description="Calculate fire and brilliance from RI at different wavelengths"
        iconPath={ICON_PATHS.sparkles}
        accent="emerald"
      >
        <DispersionCalculator />
      </ToolSection>

      <ToolSection
        id="carat-estimate"
        title="Carat Estimator"
        description="Estimate weight from dimensions and specific gravity"
        iconPath={ICON_PATHS.cube}
        accent="emerald"
      >
        <CaratEstimator />
      </ToolSection>

      <ToolSection
        id="density"
        title="Density Estimator"
        description="Alternative SG calculation for irregular shapes"
        iconPath={ICON_PATHS.beaker}
        accent="emerald"
      >
        <DensityEstimator />
      </ToolSection>
    </div>
  );
}

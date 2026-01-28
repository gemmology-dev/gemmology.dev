/**
 * Lab Equipment tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { ChelseaFilter } from './ChelseaFilter';
import { SpectroscopeCalculator } from './SpectroscopeCalculator';
import { HeavyLiquidReference } from './HeavyLiquidReference';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  filter: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z',
  spectrum: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
};

export function LabTools() {
  return (
    <div className="space-y-6">
      <ToolSection
        id="chelsea"
        title="Chelsea Filter"
        description="Expected color reactions for gem identification"
        iconPath={ICON_PATHS.filter}
        accent="rose"
      >
        <ChelseaFilter />
      </ToolSection>

      <ToolSection
        id="spectroscope"
        title="Spectroscope Calculator"
        description="Wavelength ↔ color converter and absorption line reference"
        iconPath={ICON_PATHS.spectrum}
        accent="rose"
      >
        <SpectroscopeCalculator />
      </ToolSection>

      <ToolSection
        id="heavy-liquid"
        title="Heavy Liquid Reference"
        description="SG separation guide by liquid density"
        iconPath={ICON_PATHS.beaker}
        accent="rose"
      >
        <HeavyLiquidReference />
      </ToolSection>
    </div>
  );
}

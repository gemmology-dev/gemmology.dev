/**
 * Gem Identification tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { GemIdentifier } from './GemIdentifier';
import { GemComparison } from './GemComparison';
import { HardnessReference } from './HardnessReference';
import { FractureCleavageGuide } from './FractureCleavageGuide';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  identify: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7',
  compare: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  hardness: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  split: 'M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5',
};

export function IdentificationTools() {
  return (
    <div className="space-y-6">
      <ToolSection
        id="identifier"
        title="Gem Identifier"
        description="Multi-property search to identify unknown gemstones"
        iconPath={ICON_PATHS.identify}
        accent="amber"
      >
        <GemIdentifier />
      </ToolSection>

      <ToolSection
        id="comparison"
        title="Gem Comparison"
        description="Side-by-side property comparison of 2–4 gems"
        iconPath={ICON_PATHS.compare}
        accent="amber"
      >
        <GemComparison />
      </ToolSection>

      <ToolSection
        id="hardness"
        title="Hardness Reference"
        description="Mohs scale lookup with wearability ratings"
        iconPath={ICON_PATHS.hardness}
        accent="amber"
      >
        <HardnessReference />
      </ToolSection>

      <ToolSection
        id="fracture"
        title="Fracture & Cleavage Guide"
        description="Cleavage directions and fracture pattern identification"
        iconPath={ICON_PATHS.split}
        accent="amber"
      >
        <FractureCleavageGuide />
      </ToolSection>
    </div>
  );
}

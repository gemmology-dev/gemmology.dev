/**
 * Advanced Analysis tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { TreatmentDetection } from './TreatmentDetection';
import { OriginCharacteristics } from './OriginCharacteristics';
import { ProportionAnalyzer } from './ProportionAnalyzer';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  treatment: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  globe: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  ruler: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
};

export function AdvancedTools() {
  return (
    <div className="space-y-6">
      <ToolSection
        id="treatment"
        title="Treatment Detection"
        description="Visual & instrumental indicators for common gem treatments"
        iconPath={ICON_PATHS.treatment}
        accent="cyan"
      >
        <TreatmentDetection />
      </ToolSection>

      <ToolSection
        id="origin"
        title="Origin Characteristics"
        description="Geographic origin features for major gem species"
        iconPath={ICON_PATHS.globe}
        accent="cyan"
      >
        <OriginCharacteristics />
      </ToolSection>

      <ToolSection
        id="proportion"
        title="Proportion Analyzer"
        description="Evaluate cut quality from proportion measurements"
        iconPath={ICON_PATHS.ruler}
        accent="cyan"
      >
        <ProportionAnalyzer />
      </ToolSection>
    </div>
  );
}

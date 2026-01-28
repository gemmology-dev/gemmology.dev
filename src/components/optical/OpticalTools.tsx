/**
 * Optical Properties tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { DichroscopeResults } from './DichroscopeResults';
import { PolariscopeGuide } from './PolariscopeGuide';
import { RefractometerSimulator } from './RefractometerSimulator';
import { PleochroismReference } from './PleochroismReference';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  adjust: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
};

export function OpticalTools() {
  return (
    <div className="space-y-6">
      <ToolSection
        id="dichroscope"
        title="Dichroscope Results"
        description="Input observed colors to identify dichroic gem candidates"
        iconPath={ICON_PATHS.eye}
        accent="purple"
      >
        <DichroscopeResults />
      </ToolSection>

      <ToolSection
        id="polariscope"
        title="Polariscope Guide"
        description="Interpret isotropic vs anisotropic reactions"
        iconPath={ICON_PATHS.adjust}
        accent="purple"
      >
        <PolariscopeGuide />
      </ToolSection>

      <ToolSection
        id="refractometer"
        title="Refractometer Simulator"
        description="Practice reading shadow edges on a virtual scale"
        iconPath={ICON_PATHS.beaker}
        accent="purple"
      >
        <RefractometerSimulator />
      </ToolSection>

      <ToolSection
        id="pleochroism"
        title="Pleochroism Reference"
        description="Expected pleochroic colors by gem species and strength"
        iconPath={ICON_PATHS.book}
        accent="purple"
      >
        <PleochroismReference />
      </ToolSection>
    </div>
  );
}

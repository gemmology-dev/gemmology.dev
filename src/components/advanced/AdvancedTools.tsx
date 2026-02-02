/**
 * Advanced Analysis tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { TreatmentDetection } from './TreatmentDetection';
import { ProportionAnalyzer } from './ProportionAnalyzer';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  treatment: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
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
        id="proportion"
        title="Proportion Analyzer"
        description="Evaluate cut quality from proportion measurements"
        iconPath={ICON_PATHS.ruler}
        accent="cyan"
      >
        <ProportionAnalyzer />
      </ToolSection>

      {/* Origin determination moved to comprehensive Learn section */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-cyan-900 mb-2">Origin Determination</h4>
        <p className="text-sm text-cyan-800 mb-3">
          Geographic origin determination requires comprehensive knowledge of inclusion suites,
          trace element chemistry, and regional characteristics. See our in-depth learn section:
        </p>
        <ul className="text-sm text-cyan-800 space-y-1">
          <li>
            <a href="/learn/origin/overview" className="underline hover:text-cyan-600">
              Origin determination overview →
            </a>
          </li>
          <li>
            <a href="/learn/origin/burma/ruby" className="underline hover:text-cyan-600">
              Burmese ruby characteristics →
            </a>
          </li>
          <li>
            <a href="/learn/origin/kashmir" className="underline hover:text-cyan-600">
              Kashmir sapphire identification →
            </a>
          </li>
          <li>
            <a href="/learn/origin/colombia" className="underline hover:text-cyan-600">
              Colombian emerald features →
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Advanced Analysis tools container.
 * Single-column, all-expanded layout — every tool visible at full width.
 */

import { TreatmentDetection } from './TreatmentDetection';
import { TreatmentWizard } from './TreatmentWizard';
import { ProportionAnalyzer } from './ProportionAnalyzer';
import { ToolSection } from '../ui/ToolSection';

const ICON_PATHS = {
  treatment: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  wizard: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
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
        id="treatment-wizard"
        title="Treatment Wizard"
        description="Pick the gem kind, tick observed clues, get ranked treatment likelihoods"
        iconPath={ICON_PATHS.wizard}
        accent="cyan"
      >
        <TreatmentWizard />
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
              Origin determination overview <span aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <a href="/learn/origin/burma/ruby" className="underline hover:text-cyan-600">
              Burmese ruby characteristics <span aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <a href="/learn/origin/kashmir" className="underline hover:text-cyan-600">
              Kashmir sapphire identification <span aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <a href="/learn/origin/colombia" className="underline hover:text-cyan-600">
              Colombian emerald features <span aria-hidden="true">→</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

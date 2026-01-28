/**
 * Gem Identification tools container.
 */

import { useState } from 'react';
import { GemComparison } from './GemComparison';
import { HardnessReference } from './HardnessReference';
import { FractureCleavageGuide } from './FractureCleavageGuide';
import { CalculatorCard } from '../calculator/CalculatorCard';

type IdentificationId = 'comparison' | 'hardness' | 'fracture';

interface IdentificationConfig {
  id: IdentificationId;
  label: string;
  iconPath: string;
  description: string;
  component: React.ReactNode;
}

const ICON_PATHS: Record<string, string> = {
  compare: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  hardness: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  split: 'M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5',
};

const IDENTIFICATION_TOOLS: IdentificationConfig[] = [
  {
    id: 'comparison',
    label: 'Gem Comparison',
    iconPath: ICON_PATHS.compare,
    description: 'Side-by-side property comparison (2-4 gems)',
    component: <GemComparison />,
  },
  {
    id: 'hardness',
    label: 'Hardness Reference',
    iconPath: ICON_PATHS.hardness,
    description: 'Mohs scale + wearability guide',
    component: <HardnessReference />,
  },
  {
    id: 'fracture',
    label: 'Fracture & Cleavage',
    iconPath: ICON_PATHS.split,
    description: 'Cleavage directions + fracture patterns',
    component: <FractureCleavageGuide />,
  },
];

export function IdentificationTools({ defaultExpanded = 'comparison' }: { defaultExpanded?: IdentificationId | null }) {
  const [expandedTool, setExpandedTool] = useState<IdentificationId | null>(defaultExpanded);

  const handleToggle = (id: IdentificationId) => {
    setExpandedTool(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600 mb-4">
        <p>
          Gem identification tools including side-by-side comparison, Mohs hardness reference, and cleavage/fracture patterns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {IDENTIFICATION_TOOLS.map(tool => (
          <CalculatorCard
            key={tool.id}
            id={tool.id}
            title={tool.label}
            description={tool.description}
            iconPath={tool.iconPath}
            expanded={expandedTool === tool.id}
            onToggle={() => handleToggle(tool.id)}
          >
            {tool.component}
          </CalculatorCard>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Tip: Click on any tool header to expand or collapse it.
      </p>
    </div>
  );
}

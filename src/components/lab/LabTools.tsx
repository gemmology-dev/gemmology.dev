/**
 * Lab Equipment tools container.
 */

import { useState } from 'react';
import { ChelseaFilter } from './ChelseaFilter';
import { SpectroscopeCalculator } from './SpectroscopeCalculator';
import { HeavyLiquidReference } from './HeavyLiquidReference';
import { CalculatorCard } from '../calculator/CalculatorCard';

type LabId = 'chelsea' | 'spectroscope' | 'heavy-liquid';

interface LabConfig {
  id: LabId;
  label: string;
  iconPath: string;
  description: string;
  component: React.ReactNode;
}

const ICON_PATHS: Record<string, string> = {
  filter: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z',
  spectrum: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
};

const LAB_TOOLS: LabConfig[] = [
  {
    id: 'chelsea',
    label: 'Chelsea Filter',
    iconPath: ICON_PATHS.filter,
    description: 'Expected color reactions',
    component: <ChelseaFilter />,
  },
  {
    id: 'spectroscope',
    label: 'Spectroscope Calculator',
    iconPath: ICON_PATHS.spectrum,
    description: 'Wavelength ↔ color + absorption lines',
    component: <SpectroscopeCalculator />,
  },
  {
    id: 'heavy-liquid',
    label: 'Heavy Liquid Reference',
    iconPath: ICON_PATHS.beaker,
    description: 'SG separation by liquid density',
    component: <HeavyLiquidReference />,
  },
];

export function LabTools({ defaultExpanded = 'chelsea' }: { defaultExpanded?: LabId | null }) {
  const [expandedTool, setExpandedTool] = useState<LabId | null>(defaultExpanded);

  const handleToggle = (id: LabId) => {
    setExpandedTool(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600 mb-4">
        <p>
          Lab equipment reference tools including Chelsea filter reactions, spectroscope line calculator, and heavy liquid SG separation guide.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LAB_TOOLS.map(tool => (
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

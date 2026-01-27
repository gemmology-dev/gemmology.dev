/**
 * Main Calculator component with tabbed interface.
 * Combines all gemmological calculators in one place.
 */

import { useState } from 'react';
import { SGCalculator } from './SGCalculator';
import { BirefringenceCalc } from './BirefringenceCalc';
import { CriticalAngleCalc } from './CriticalAngleCalc';
import { WeightConverter } from './WeightConverter';
import { LengthConverter } from './LengthConverter';
import { TemperatureConverter } from './TemperatureConverter';
import { CaratEstimator } from './CaratEstimator';
import { RICalculator } from './RICalculator';
import { cn } from '../ui/cn';

type CalculatorTab =
  | 'sg'
  | 'ri-lookup'
  | 'birefringence'
  | 'critical-angle'
  | 'carat-estimate'
  | 'weight'
  | 'length'
  | 'temperature';

interface Tab {
  id: CalculatorTab;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  { id: 'sg', label: 'Specific Gravity', icon: 'scale', description: 'Calculate SG from hydrostatic weighing' },
  { id: 'ri-lookup', label: 'RI Lookup', icon: 'search', description: 'Find gems by refractive index' },
  { id: 'birefringence', label: 'Birefringence', icon: 'layers', description: 'Calculate birefringence from RI values' },
  { id: 'critical-angle', label: 'Critical Angle', icon: 'arrow-right', description: 'Calculate TIR critical angle' },
  { id: 'carat-estimate', label: 'Carat Estimate', icon: 'cube', description: 'Estimate weight from dimensions' },
  { id: 'weight', label: 'Weight', icon: 'weight', description: 'Convert ct/g/mg' },
  { id: 'length', label: 'Length', icon: 'ruler', description: 'Convert mm/inches' },
  { id: 'temperature', label: 'Temperature', icon: 'thermometer', description: 'Convert °C/°F' },
];

const ICON_PATHS: Record<string, string> = {
  scale: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  layers: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  'arrow-right': 'M13 7l5 5m0 0l-5 5m5-5H6',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  weight: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  ruler: 'M6 20h12M6 4h12m-6 0v16',
  thermometer: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

interface CalculatorProps {
  defaultTab?: CalculatorTab;
}

export function Calculator({ defaultTab = 'sg' }: CalculatorProps) {
  const [activeTab, setActiveTab] = useState<CalculatorTab>(defaultTab);

  const renderCalculator = () => {
    switch (activeTab) {
      case 'sg':
        return <SGCalculator />;
      case 'ri-lookup':
        return <RICalculator />;
      case 'birefringence':
        return <BirefringenceCalc />;
      case 'critical-angle':
        return <CriticalAngleCalc />;
      case 'carat-estimate':
        return <CaratEstimator />;
      case 'weight':
        return <WeightConverter />;
      case 'length':
        return <LengthConverter />;
      case 'temperature':
        return <TemperatureConverter />;
      default:
        return null;
    }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Tab navigation - sidebar on desktop, horizontal on mobile */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-4">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all whitespace-nowrap',
                  'border-2',
                  activeTab === tab.id
                    ? 'border-crystal-500 bg-crystal-50 text-crystal-700'
                    : 'border-transparent hover:bg-slate-50 text-slate-600'
                )}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PATHS[tab.icon]} />
                </svg>
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Calculator content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">
              {activeTabInfo?.label}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeTabInfo?.description}
            </p>
          </div>

          {/* Calculator body */}
          <div className="p-6">
            {renderCalculator()}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface Preset {
  name: string;
  cdl: string;
  system: string;
}

interface PresetSelectorProps {
  presets: Preset[];
  onSelect: (preset: Preset) => void;
  className?: string;
}

export function PresetSelector({ presets, onSelect, className }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPresets = presets.filter(
    (preset) =>
      preset.name.toLowerCase().includes(search.toLowerCase()) ||
      preset.system.toLowerCase().includes(search.toLowerCase())
  );

  const groupedPresets = filteredPresets.reduce((acc, preset) => {
    const system = preset.system;
    if (!acc[system]) acc[system] = [];
    acc[system].push(preset);
    return acc;
  }, {} as Record<string, Preset[]>);

  const handleSelect = useCallback(
    (preset: Preset) => {
      onSelect(preset);
      setIsOpen(false);
      setSearch('');
    },
    [onSelect]
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Load Preset
        <svg
          className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="search"
              placeholder="Search presets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crystal-500/20 focus:border-crystal-500"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {Object.keys(groupedPresets).length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No presets found</div>
            ) : (
              Object.entries(groupedPresets).map(([system, systemPresets]) => (
                <div key={system}>
                  <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0">
                    {system}
                  </div>
                  {systemPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleSelect(preset)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-crystal-50 hover:text-crystal-700 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

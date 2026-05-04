import { SearchInput } from '../ui/SearchInput';
import { clsx } from 'clsx';

const originStyles: Record<string, { active: string; inactive: string }> = {
  natural: {
    active: 'bg-emerald-600 text-white',
    inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  },
  synthetic: {
    active: 'bg-blue-600 text-white',
    inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
  },
  simulant: {
    active: 'bg-amber-600 text-white',
    inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
  },
  composite: {
    active: 'bg-slate-600 text-white',
    inactive: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300',
  },
};

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  systems: string[];
  selectedSystem: string | null;
  onSystemChange: (system: string | null) => void;
  origins?: string[];
  selectedOrigin?: string | null;
  onOriginChange?: (origin: string | null) => void;
  mineralGroups?: string[];
  selectedGroup?: string | null;
  onGroupChange?: (group: string | null) => void;
  resultCount?: number;
  resultLabel?: string;
  className?: string;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  systems,
  selectedSystem,
  onSystemChange,
  origins = [],
  selectedOrigin = null,
  onOriginChange,
  mineralGroups = [],
  selectedGroup = null,
  onGroupChange,
  resultCount,
  resultLabel = 'mineral',
  className,
}: FilterBarProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search minerals by name, chemistry, or system..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
          />
        </div>
        {resultCount !== undefined && (
          <div className="flex items-center text-sm text-slate-500">
            {resultCount} {resultCount === 1 ? resultLabel.replace(/ies$/, 'y').replace(/s$/, '') : resultLabel}
          </div>
        )}
      </div>

      {/* Origin filter tabs */}
      {origins.length > 1 && onOriginChange && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onOriginChange(null)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedOrigin === null
                ? 'bg-crystal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            All Types
          </button>
          {origins.map((origin) => {
            const styles = originStyles[origin] || originStyles.natural;
            return (
              <button
                key={origin}
                onClick={() => onOriginChange(origin)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                  selectedOrigin === origin ? styles.active : styles.inactive
                )}
              >
                {origin}
              </button>
            );
          })}
        </div>
      )}

      {/* Crystal system filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSystemChange(null)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedSystem === null && selectedGroup === null
              ? 'bg-crystal-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          All Systems
        </button>
        {systems.map((system) => (
          <button
            key={system}
            onClick={() => onSystemChange(system)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedSystem === system
                ? 'bg-crystal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {system}
          </button>
        ))}
      </div>

      {/* Mineral group filter */}
      {mineralGroups.length > 0 && onGroupChange && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center text-xs font-medium text-slate-400 uppercase tracking-wider mr-1">Groups</span>
          {mineralGroups.map((group) => (
            <button
              key={group}
              onClick={() => onGroupChange(selectedGroup === group ? null : group)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedGroup === group
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
              )}
            >
              {group.replace(' Group', '')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

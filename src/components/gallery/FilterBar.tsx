import { SearchInput } from '../ui/SearchInput';
import { clsx } from 'clsx';

const originStyles: Record<string, { active: string; inactive: string }> = {
  natural: {
    active: 'bg-emerald-600 text-white dark:bg-emerald-500',
    inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20 dark:border-emerald-400/20',
  },
  synthetic: {
    active: 'bg-blue-600 text-white dark:bg-blue-500',
    inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/20 dark:border-blue-400/20',
  },
  simulant: {
    active: 'bg-amber-600 text-white dark:bg-amber-500',
    inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/20 dark:border-amber-400/20',
  },
  composite: {
    active: 'bg-slate-600 text-white dark:bg-coffee-raised2 dark:text-cream-primary',
    inactive: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300 dark:bg-coffee-raised dark:text-cream-secondary dark:hover:bg-coffee-raised2 dark:border-coffee-border',
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
          <label htmlFor="gallery-search" className="sr-only">
            Search minerals
          </label>
          <SearchInput
            id="gallery-search"
            name="gallery-search"
            placeholder="Search minerals by name, chemistry, or system..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
          />
        </div>
        {resultCount !== undefined && (
          <div className="flex items-center text-sm text-slate-600 dark:text-cream-secondary">
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
                ? 'bg-crystal-700 text-white dark:bg-crystal-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-coffee-raised dark:text-cream-secondary dark:hover:bg-coffee-raised2'
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
              ? 'bg-crystal-700 text-white dark:bg-crystal-600'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-coffee-raised dark:text-cream-secondary dark:hover:bg-coffee-raised2'
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
                ? 'bg-crystal-700 text-white dark:bg-crystal-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-coffee-raised dark:text-cream-secondary dark:hover:bg-coffee-raised2'
            )}
          >
            {system}
          </button>
        ))}
      </div>

      {/* Mineral group filter — collapses to a select once there are too many
          to fit on a single row without overflow (P2-8). */}
      {mineralGroups.length > 0 && onGroupChange && (
        mineralGroups.length > 6 ? (
          <div className="flex items-center gap-3">
            <label htmlFor="gallery-group-select" className="text-xs font-semibold text-slate-600 dark:text-cream-secondary uppercase tracking-wider">
              Group
            </label>
            <select
              id="gallery-group-select"
              value={selectedGroup ?? ''}
              onChange={(e) => onGroupChange(e.target.value === '' ? null : e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 rounded-full text-sm font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/20 dark:hover:bg-violet-400/20 dark:focus:ring-violet-400/40"
            >
              <option value="">All groups ({mineralGroups.length})</option>
              {mineralGroups.map((group) => (
                <option key={group} value={group}>
                  {group.replace(' Group', '')}
                </option>
              ))}
            </select>
            {selectedGroup && (
              <button
                type="button"
                onClick={() => onGroupChange(null)}
                className="text-sm text-slate-600 hover:text-slate-700 dark:text-cream-secondary dark:hover:text-cream-primary underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center text-xs font-semibold text-slate-600 dark:text-cream-secondary uppercase tracking-wider mr-1">Groups</span>
            {mineralGroups.map((group) => (
              <button
                key={group}
                onClick={() => onGroupChange(selectedGroup === group ? null : group)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedGroup === group
                    ? 'bg-violet-600 text-white dark:bg-violet-500'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20 dark:border-violet-400/20'
                )}
              >
                {group.replace(' Group', '')}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

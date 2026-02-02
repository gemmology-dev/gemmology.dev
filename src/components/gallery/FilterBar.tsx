import { SearchInput } from '../ui/SearchInput';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  systems: string[];
  selectedSystem: string | null;
  onSystemChange: (system: string | null) => void;
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSystemChange(null)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedSystem === null
              ? 'bg-crystal-600 text-white'
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
                ? 'bg-crystal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {system}
          </button>
        ))}
      </div>
    </div>
  );
}

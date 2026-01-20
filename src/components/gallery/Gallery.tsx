import { useState, useEffect, useCallback } from 'react';
import { GalleryGrid } from './GalleryGrid';
import { FilterBar } from './FilterBar';
import { useCrystalDB, useFilters } from '../../hooks/useCrystalDB';

export function Gallery() {
  const { minerals, loading, error, search, filterBySystem } = useCrystalDB();
  const { systems, loading: filtersLoading } = useFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setSelectedSystem(null);
      search(query);
    },
    [search]
  );

  const handleSystemChange = useCallback(
    (system: string | null) => {
      setSelectedSystem(system);
      setSearchQuery('');
      filterBySystem(system);
    },
    [filterBySystem]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        search(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">Failed to load minerals</h3>
        <p className="mt-2 text-slate-500">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-crystal-600 hover:text-crystal-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        systems={systems}
        selectedSystem={selectedSystem}
        onSystemChange={handleSystemChange}
        resultCount={minerals.length}
      />

      <GalleryGrid minerals={minerals} loading={loading || filtersLoading} />
    </div>
  );
}

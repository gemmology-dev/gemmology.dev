import { useState, useEffect, useCallback, useMemo } from 'react';
import { GalleryGrid } from './GalleryGrid';
import { FilterBar } from './FilterBar';
import { Pagination } from '../ui/Pagination';
import { useFamilies } from '../../hooks/useFamilies';
import { useFilters } from '../../hooks/useCrystalDB';
import { usePagination } from '../../hooks/usePagination';
import type { MineralFamily } from '../../lib/db';

interface GalleryProps {
  initialSystem?: string;
  initialSearch?: string;
  initialOrigin?: string;
  /** SSG-fetched families — when present, the wasm DB only loads on filter/search. */
  initialFamilies?: MineralFamily[];
  initialSystems?: string[];
  initialOrigins?: string[];
  initialGroups?: string[];
}

export function Gallery({
  initialSystem = '',
  initialSearch = '',
  initialOrigin = '',
  initialFamilies,
  initialSystems,
  initialOrigins,
  initialGroups,
}: GalleryProps) {
  const { families, loading, error, search, filterBySystem, filterByOrigin, filterByGroup } = useFamilies(initialFamilies);
  const { systems, origins, mineralGroups, loading: filtersLoading } = useFilters({
    systems: initialSystems,
    origins: initialOrigins,
    mineralGroups: initialGroups,
  });
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(initialSystem || null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(initialOrigin || null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Pagination
  const { page, params: paginationParams, onPageChange, onPageSizeChange, resetPage } = usePagination({
    initialPageSize: 12, // 4 columns x 3 rows
  });

  // Paginate families
  const totalPages = Math.ceil(families.length / paginationParams.pageSize);
  const startIndex = (page - 1) * paginationParams.pageSize;
  const paginatedFamilies = useMemo(() => {
    return families.slice(startIndex, startIndex + paginationParams.pageSize);
  }, [families, startIndex, paginationParams.pageSize]);

  const pagination = {
    page,
    pageSize: paginationParams.pageSize,
    total: families.length,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setSelectedSystem(null);
      setSelectedOrigin(null);
      setSelectedGroup(null);
      search(query);
      resetPage();
    },
    [search, resetPage]
  );

  const handleSystemChange = useCallback(
    (system: string | null) => {
      setSelectedSystem(system);
      setSelectedOrigin(null);
      setSelectedGroup(null);
      setSearchQuery('');
      filterBySystem(system);
      resetPage();
    },
    [filterBySystem, resetPage]
  );

  const handleOriginChange = useCallback(
    (origin: string | null) => {
      setSelectedOrigin(origin);
      setSelectedSystem(null);
      setSelectedGroup(null);
      setSearchQuery('');
      filterByOrigin(origin);
      resetPage();
    },
    [filterByOrigin, resetPage]
  );

  const handleGroupChange = useCallback(
    (group: string | null) => {
      setSelectedGroup(group);
      setSelectedSystem(null);
      setSelectedOrigin(null);
      setSearchQuery('');
      filterByGroup(group);
      resetPage();
    },
    [filterByGroup, resetPage]
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

  // Apply initial filters from URL on mount
  useEffect(() => {
    if (initialOrigin) {
      filterByOrigin(initialOrigin);
    } else if (initialSystem) {
      filterBySystem(initialSystem);
    } else if (initialSearch) {
      search(initialSearch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL state when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSystem) params.set('system', selectedSystem);
    if (selectedOrigin) params.set('origin', selectedOrigin);
    if (selectedGroup) params.set('group', selectedGroup);
    if (searchQuery) params.set('search', searchQuery);

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [selectedSystem, selectedOrigin, selectedGroup, searchQuery]);

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">Failed to load families</h3>
        <p className="mt-2 text-slate-600">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-crystal-700 hover:text-crystal-700 font-medium"
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
        origins={origins}
        selectedOrigin={selectedOrigin}
        onOriginChange={handleOriginChange}
        mineralGroups={mineralGroups}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        resultCount={families.length}
        resultLabel="families"
      />

      <GalleryGrid families={paginatedFamilies} loading={loading || filtersLoading} />

      {!loading && !filtersLoading && totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSize
        />
      )}
    </div>
  );
}

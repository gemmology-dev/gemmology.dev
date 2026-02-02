/**
 * Hook to manage pagination state for database queries.
 * Provides page/pageSize state and handlers for pagination controls.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  type PaginationParams,
  type PaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '../lib/pagination';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn<T> {
  // Current pagination state
  page: number;
  pageSize: number;
  params: PaginationParams;

  // State setters
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Event handlers for Pagination component
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  // Reset to first page (useful after filters change)
  resetPage: () => void;

  // Helper to extract pagination props for Pagination component
  getPaginationProps: (result: PaginatedResult<T>) => {
    pagination: PaginatedResult<T>['pagination'];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

/**
 * Hook to manage pagination state for use with paginated database queries.
 *
 * @example
 * ```tsx
 * const { params, getPaginationProps, resetPage } = usePagination<Mineral>();
 * const [data, setData] = useState<PaginatedResult<Mineral> | null>(null);
 *
 * useEffect(() => {
 *   getMineralsWithHardnessPaginated(params).then(setData);
 * }, [params]);
 *
 * // Reset to page 1 when search changes
 * useEffect(() => { resetPage(); }, [searchTerm]);
 *
 * return (
 *   <>
 *     <Table data={data?.data ?? []} />
 *     {data && <Pagination {...getPaginationProps(data)} />}
 *   </>
 * );
 * ```
 */
export function usePagination<T = unknown>(
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { initialPage = 1, initialPageSize = DEFAULT_PAGE_SIZE } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Memoize params object to prevent unnecessary re-renders
  const params = useMemo<PaginationParams>(
    () => ({ page, pageSize }),
    [page, pageSize]
  );

  // Page change handler - also used as event handler
  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Page size change handler - resets to page 1
  const onPageSizeChange = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  // Alias for clarity
  const setPageSize = onPageSizeChange;

  // Reset to first page
  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  // Helper to extract props for Pagination component
  const getPaginationProps = useCallback(
    (result: PaginatedResult<T>) => ({
      pagination: result.pagination,
      onPageChange,
      onPageSizeChange,
    }),
    [onPageChange, onPageSizeChange]
  );

  return {
    page,
    pageSize,
    params,
    setPage,
    setPageSize,
    onPageChange,
    onPageSizeChange,
    resetPage,
    getPaginationProps,
  };
}

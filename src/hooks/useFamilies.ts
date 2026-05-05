import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllFamilies,
  getFamilyById,
  getFamilyWithExpressions,
  searchFamilies,
  getFamiliesBySystem,
  getFamiliesByOrigin,
  getFamiliesByGroup,
  getExpressionsForFamily,
  type MineralFamily,
  type MineralFamilyWithExpressions,
  type MineralExpression,
} from '../lib/db';

interface UseFamiliesResult {
  families: MineralFamily[];
  loading: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
  filterBySystem: (system: string | null) => Promise<void>;
  filterByOrigin: (origin: string | null) => Promise<void>;
  filterByGroup: (group: string | null) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for loading and filtering mineral families in the gallery.
 * Returns families with expression counts (no duplicates like the old minerals approach).
 *
 * When `initialFamilies` is provided (build-time SSG case), skips the initial
 * sql.js fetch and serves them synchronously on first paint. The wasm DB only
 * loads on the first dynamic action (search/filter).
 */
export function useFamilies(initialFamilies?: MineralFamily[]): UseFamiliesResult {
  const hasInitial = Array.isArray(initialFamilies);
  const initialRef = useRef<MineralFamily[] | undefined>(initialFamilies);
  const [families, setFamilies] = useState<MineralFamily[]>(initialFamilies ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<Error | null>(null);

  const loadAll = useCallback(async () => {
    // Reset to SSG-fetched data without touching wasm DB when available.
    if (initialRef.current) {
      setFamilies(initialRef.current);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getAllFamilies();
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load families'));
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      return loadAll();
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchFamilies(query);
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  const filterBySystem = useCallback(async (system: string | null) => {
    if (!system) {
      return loadAll();
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getFamiliesBySystem(system);
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Filter failed'));
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  const filterByOrigin = useCallback(async (origin: string | null) => {
    if (!origin) {
      return loadAll();
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getFamiliesByOrigin(origin);
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Filter failed'));
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  const filterByGroup = useCallback(async (group: string | null) => {
    if (!group) {
      return loadAll();
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getFamiliesByGroup(group);
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Filter failed'));
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  useEffect(() => {
    if (hasInitial) return;
    loadAll();
  }, [loadAll, hasInitial]);

  return {
    families,
    loading,
    error,
    search,
    filterBySystem,
    filterByOrigin,
    filterByGroup,
    refresh: loadAll,
  };
}

interface UseFamilyResult {
  family: MineralFamilyWithExpressions | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for loading a single family with all its expressions.
 */
export function useFamily(familyId: string | undefined): UseFamilyResult {
  const [family, setFamily] = useState<MineralFamilyWithExpressions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!familyId) {
      setFamily(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFamilyWithExpressions(familyId);
        setFamily(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load family'));
      } finally {
        setLoading(false);
      }
    })();
  }, [familyId]);

  return { family, loading, error };
}

interface UseFamilyExpressionsResult {
  expressions: MineralExpression[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for loading expressions for a family.
 */
export function useFamilyExpressions(familyId: string | undefined): UseFamilyExpressionsResult {
  const [expressions, setExpressions] = useState<MineralExpression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!familyId) {
      setExpressions([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getExpressionsForFamily(familyId);
        setExpressions(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load expressions'));
      } finally {
        setLoading(false);
      }
    })();
  }, [familyId]);

  return { expressions, loading, error };
}

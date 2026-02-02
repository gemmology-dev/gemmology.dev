import { useState, useEffect, useCallback } from 'react';
import {
  getAllFamilies,
  getFamilyById,
  getFamilyWithExpressions,
  searchFamilies,
  getFamiliesBySystem,
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
  refresh: () => Promise<void>;
}

/**
 * Hook for loading and filtering mineral families in the gallery.
 * Returns families with expression counts (no duplicates like the old minerals approach).
 */
export function useFamilies(): UseFamiliesResult {
  const [families, setFamilies] = useState<MineralFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAll = useCallback(async () => {
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

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    families,
    loading,
    error,
    search,
    filterBySystem,
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

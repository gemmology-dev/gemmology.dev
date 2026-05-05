import { useState, useEffect, useCallback } from 'react';
import {
  getAllMinerals,
  getMineralByName,
  searchMinerals,
  getMineralsBySystem,
  getMineralsByCategory,
  getCrystalSystems,
  getCategories,
  getMineralGroups,
  getOrigins,
  type Mineral,
} from '../lib/db';

interface UseCrystalDBResult {
  minerals: Mineral[];
  loading: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
  filterBySystem: (system: string | null) => Promise<void>;
  filterByCategory: (category: string | null) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCrystalDB(): UseCrystalDBResult {
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllMinerals();
      setMinerals(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load minerals'));
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
      const data = await searchMinerals(query);
      setMinerals(data);
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
      const data = await getMineralsBySystem(system);
      setMinerals(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Filter failed'));
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  const filterByCategory = useCallback(async (category: string | null) => {
    if (!category) {
      return loadAll();
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getMineralsByCategory(category);
      setMinerals(data);
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
    minerals,
    loading,
    error,
    search,
    filterBySystem,
    filterByCategory,
    refresh: loadAll,
  };
}

interface UseMineralResult {
  mineral: Mineral | null;
  loading: boolean;
  error: Error | null;
}

export function useMineral(name: string | undefined): UseMineralResult {
  const [mineral, setMineral] = useState<Mineral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!name) {
      setMineral(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMineralByName(name);
        setMineral(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load mineral'));
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  return { mineral, loading, error };
}

interface UseFiltersResult {
  systems: string[];
  categories: string[];
  origins: string[];
  mineralGroups: string[];
  loading: boolean;
}

interface UseFiltersInitial {
  systems?: string[];
  categories?: string[];
  origins?: string[];
  mineralGroups?: string[];
}

/**
 * When initial filter lists are provided (SSG case), skips the wasm-DB hit and
 * serves the filter dropdowns synchronously.
 */
export function useFilters(initial: UseFiltersInitial = {}): UseFiltersResult {
  const hasInitial = Boolean(
    initial.systems || initial.categories || initial.origins || initial.mineralGroups,
  );
  const [systems, setSystems] = useState<string[]>(initial.systems ?? []);
  const [categories, setCategories] = useState<string[]>(initial.categories ?? []);
  const [origins, setOrigins] = useState<string[]>(initial.origins ?? []);
  const [mineralGroups, setMineralGroups] = useState<string[]>(initial.mineralGroups ?? []);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) return;
    (async () => {
      try {
        const [systemsData, categoriesData, originsData, groupsData] = await Promise.all([
          getCrystalSystems(),
          getCategories(),
          getOrigins(),
          getMineralGroups(),
        ]);
        setSystems(systemsData);
        setCategories(categoriesData);
        setOrigins(originsData);
        setMineralGroups(groupsData);
      } catch {
        // Silently fail - filters will be empty
      } finally {
        setLoading(false);
      }
    })();
  }, [hasInitial]);

  return { systems, categories, origins, mineralGroups, loading };
}

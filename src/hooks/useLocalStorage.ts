/**
 * React hook for persisting state to localStorage.
 * Handles serialization, deserialization, and SSR safety.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for reading and writing to localStorage with React state sync.
 * @param key The localStorage key
 * @param initialValue Initial value if nothing is stored
 * @returns Tuple of [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state with stored value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for checking if a localStorage key exists without reading its value.
 * @param key The localStorage key to check
 * @returns Whether the key exists
 */
export function useLocalStorageExists(key: string): boolean {
  const [exists, setExists] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setExists(window.localStorage.getItem(key) !== null);
    }
  }, [key]);

  return exists;
}

/**
 * Clear all quiz-related data from localStorage.
 * Useful for a "reset progress" feature.
 */
export function clearQuizStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove = [
    'gemmology-quiz-state',
    'gemmology-quiz-progress',
    'gemmology-exam-state',
  ];

  keysToRemove.forEach(key => {
    window.localStorage.removeItem(key);
  });
}

/** Storage keys used by the quiz system */
export const STORAGE_KEYS = {
  QUIZ_STATE: 'gemmology-quiz-state',
  QUIZ_PROGRESS: 'gemmology-quiz-progress',
  EXAM_STATE: 'gemmology-exam-state',
} as const;

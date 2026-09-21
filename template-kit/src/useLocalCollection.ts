'use client';
import { useCallback, useEffect, useState } from 'react';

export interface LocalCollectionItem {
  id: string;
}

export interface UseLocalCollectionResult<T extends LocalCollectionItem> {
  items: T[];
  add: (item: T) => void;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
  reset: () => void;
}

function readStorage<T>(storageKey: string): T[] | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

function writeStorage<T>(storageKey: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

export function useLocalCollection<T extends LocalCollectionItem>(
  storageKey: string,
  seedData: T[],
): UseLocalCollectionResult<T> {
  const [items, setItems] = useState<T[]>(seedData);

  useEffect(() => {
    const stored = readStorage<T>(storageKey);
    if (stored === null) {
      writeStorage(storageKey, seedData);
      setItems(seedData);
    } else {
      setItems(stored);
    }
    // seedData is a caller-provided literal per mount; re-running only on storageKey change
    // matches the "first visit vs. returning visitor" contract, not React's own dep-array rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const add = useCallback((item: T) => {
    setItems((prev) => {
      const next = [...prev, item];
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => {
      const next = prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const reset = useCallback(() => {
    writeStorage(storageKey, seedData);
    setItems(seedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return { items, add, update, remove, reset };
}

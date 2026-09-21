'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

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

// Reads swallow: a storage that cannot be read just means "no saved data". getItem itself throws
// in private-mode Safari, so it has to sit inside the try, not above it.
function readStorage<T>(storageKey: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return null;
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

// Writes deliberately propagate, so a caller can catch a quota or private-mode failure and tell
// the user. That only works if the write happens synchronously inside the caller's handler -- see
// the note on add/update/remove below.
function writeStorage<T>(storageKey: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

export function useLocalCollection<T extends LocalCollectionItem>(
  storageKey: string,
  seedData: T[],
): UseLocalCollectionResult<T> {
  const [items, setItems] = useState<T[]>(seedData);

  // Mirrors items so the mutators can compute the next value synchronously in the caller's stack.
  // Persisting inside a setItems updater looked equivalent and was not: updater functions run when
  // React processes the update, after the caller's try/catch has already exited, so a failed write
  // escaped every call site. React also requires updaters to be pure, and StrictMode double-invokes
  // them, which wrote twice.
  const itemsRef = useRef<T[]>(seedData);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Write first, then set state. If the write throws, state is untouched, so the UI never shows an
  // item as saved when it was not.
  const commit = useCallback((next: T[]) => {
    writeStorage(storageKey, next);
    itemsRef.current = next;
    setItems(next);
  }, [storageKey]);

  useEffect(() => {
    const stored = readStorage<T>(storageKey);
    if (stored === null) {
      // Seeding on first visit is best-effort: a storage failure here must not take the page down.
      try {
        writeStorage(storageKey, seedData);
      } catch {
        /* the page still works, the collection just will not persist */
      }
      itemsRef.current = seedData;
      setItems(seedData);
    } else {
      itemsRef.current = stored;
      setItems(stored);
    }
    // seedData is a caller-provided literal per mount; re-running only on storageKey change
    // matches the "first visit vs. returning visitor" contract, not React's own dep-array rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const add = useCallback((item: T) => {
    commit([...itemsRef.current, item]);
  }, [commit]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    commit(itemsRef.current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, [commit]);

  const remove = useCallback((id: string) => {
    commit(itemsRef.current.filter((entry) => entry.id !== id));
  }, [commit]);

  const reset = useCallback(() => {
    commit(seedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return { items, add, update, remove, reset };
}

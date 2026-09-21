import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalCollection } from './useLocalCollection';

interface Item {
  id: string;
  label: string;
}

const SEED: Item[] = [{ id: '1', label: 'Seed item' }];

beforeEach(() => {
  window.localStorage.clear();
});

describe('useLocalCollection', () => {
  it('returns seedData synchronously on first render before any effect runs', () => {
    const { result } = renderHook(() => useLocalCollection('test-key-1', SEED));
    expect(result.current.items).toEqual(SEED);
  });

  it('writes seedData into localStorage on first visit', async () => {
    renderHook(() => useLocalCollection('test-key-2', SEED));
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('test-key-2')!)).toEqual(SEED);
    });
  });

  it('persists an add() mutation to localStorage and to items', async () => {
    const { result } = renderHook(() => useLocalCollection('test-key-3', SEED));
    await waitFor(() => expect(result.current.items).toEqual(SEED));

    act(() => {
      result.current.add({ id: '2', label: 'New item' });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
      expect(JSON.parse(window.localStorage.getItem('test-key-3')!)).toHaveLength(2);
    });
  });

  it('reads existing localStorage data instead of seedData on a later mount', async () => {
    window.localStorage.setItem('test-key-4', JSON.stringify([{ id: '9', label: 'Returning visitor data' }]));
    const { result } = renderHook(() => useLocalCollection('test-key-4', SEED));
    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: '9', label: 'Returning visitor data' }]);
    });
  });

  it('reset() re-seeds from the original seedData', async () => {
    const { result } = renderHook(() => useLocalCollection('test-key-5', SEED));
    await waitFor(() => expect(result.current.items).toEqual(SEED));

    act(() => {
      result.current.add({ id: '2', label: 'Temp item' });
    });
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => {
      result.current.reset();
    });
    await waitFor(() => {
      expect(result.current.items).toEqual(SEED);
      expect(JSON.parse(window.localStorage.getItem('test-key-5')!)).toEqual(SEED);
    });
  });

  it('two hooks with different storageKeys never share data', async () => {
    const a = renderHook(() => useLocalCollection('isolated-key-a', [{ id: '1', label: 'A' }]));
    const b = renderHook(() => useLocalCollection('isolated-key-b', [{ id: '1', label: 'B' }]));

    await waitFor(() => {
      expect(a.result.current.items[0].label).toBe('A');
      expect(b.result.current.items[0].label).toBe('B');
    });

    act(() => {
      a.result.current.add({ id: '2', label: 'Only in A' });
    });

    await waitFor(() => expect(a.result.current.items).toHaveLength(2));
    expect(b.result.current.items).toHaveLength(1);
  });

  it('update() patches a single item by id, remove() drops it', async () => {
    const { result } = renderHook(() => useLocalCollection('test-key-6', SEED));
    await waitFor(() => expect(result.current.items).toEqual(SEED));

    act(() => {
      result.current.update('1', { label: 'Edited' });
    });
    await waitFor(() => expect(result.current.items[0].label).toBe('Edited'));

    act(() => {
      result.current.remove('1');
    });
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });
});

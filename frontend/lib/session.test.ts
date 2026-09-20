import { describe, it, expect, vi, afterEach } from "vitest";
import { getSessionId } from "./session";

describe("session", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as Record<string, unknown>).window;
    }
  });

  it("returns null when sessionStorage is unavailable (SSR)", () => {
    delete (globalThis as Record<string, unknown>).window;
    expect(getSessionId()).toBeNull();
  });

  it("generates and stores on first call, and returns the same id on the second call", () => {
    const store = new Map<string, string>();
    const mockSessionStorage = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
    };

    (globalThis as Record<string, unknown>).window = {
      sessionStorage: mockSessionStorage,
    };

    const firstId = getSessionId();
    expect(firstId).toBeTruthy();
    expect(typeof firstId).toBe("string");
    expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);

    const secondId = getSessionId();
    // Decision (f) & Mutation M4: must return the exact same persisted sessionId
    expect(secondId).toBe(firstId);
    expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockSessionStorage.getItem).toHaveBeenCalled();
  });
});

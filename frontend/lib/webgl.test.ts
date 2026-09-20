import { describe, it, expect, vi, afterEach } from "vitest";
import { isWebGLAvailable } from "./webgl";

describe("webgl", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as Record<string, unknown>).window;
    }
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    } else {
      delete (globalThis as Record<string, unknown>).document;
    }
  });

  it("returns false when window or document is unavailable (SSR)", () => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
    expect(isWebGLAvailable()).toBe(false);
  });

  it("returns false when getContext returns null", () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(null),
    };
    (globalThis as Record<string, unknown>).window = { WebGLRenderingContext: class {} };
    (globalThis as Record<string, unknown>).document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    };

    expect(isWebGLAvailable()).toBe(false);
    expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl");
  });

  it("returns true when getContext returns a valid context object", () => {
    const mockContext = {};
    const mockCanvas = {
      getContext: vi.fn((type: string) => {
        if (type === "webgl" || type === "experimental-webgl") {
          return mockContext;
        }
        return null;
      }),
    };
    (globalThis as Record<string, unknown>).window = { WebGLRenderingContext: class {} };
    (globalThis as Record<string, unknown>).document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    };

    expect(isWebGLAvailable()).toBe(true);
  });

  it("returns false when getContext throws an error", () => {
    const mockCanvas = {
      getContext: vi.fn().mockImplementation(() => {
        throw new Error("GPU crashed or disabled");
      }),
    };
    (globalThis as Record<string, unknown>).window = { WebGLRenderingContext: class {} };
    (globalThis as Record<string, unknown>).document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    };

    expect(isWebGLAvailable()).toBe(false);
  });
});

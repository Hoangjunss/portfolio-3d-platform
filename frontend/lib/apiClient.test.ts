import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTemplates, trackEvent, type Template } from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTemplates", () => {
    it("parses a full thirteen-field payload", async () => {
      const mockTemplate: Template = {
        id: 1,
        name: "Restaurant Showcase",
        slug: "restaurant-showcase",
        subdomain: "restaurant",
        thumbnailMediaId: 42,
        thumbnailUrl: "https://example.com/media/restaurant.webp",
        description: "A 3D showcase for modern restaurants",
        category: "Hospitality",
        techTags: "Three.js, React, Tailwind",
        displayOrder: 1,
        active: true,
        viewCount: 120,
        clickCount: 45,
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => [mockTemplate],
        }))
      );

      const templates = await getTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0]).toEqual(mockTemplate);
      expect(templates[0].id).toBe(1);
      expect(templates[0].name).toBe("Restaurant Showcase");
      expect(templates[0].slug).toBe("restaurant-showcase");
      expect(templates[0].subdomain).toBe("restaurant");
      expect(templates[0].thumbnailMediaId).toBe(42);
      expect(templates[0].thumbnailUrl).toBe("https://example.com/media/restaurant.webp");
      expect(templates[0].description).toBe("A 3D showcase for modern restaurants");
      expect(templates[0].category).toBe("Hospitality");
      expect(templates[0].techTags).toBe("Three.js, React, Tailwind");
      expect(templates[0].displayOrder).toBe(1);
      expect(templates[0].active).toBe(true);
      expect(templates[0].viewCount).toBe(120);
      expect(templates[0].clickCount).toBe(45);
    });

    it("throws on a non-2xx response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        }))
      );

      await expect(getTemplates()).rejects.toThrow("Failed to load templates: 500");
    });

    it("passes an abort signal to fetch", async () => {
      let capturedSignal: AbortSignal | undefined;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init?: RequestInit) => {
          capturedSignal = init?.signal as AbortSignal | undefined;
          return {
            ok: true,
            status: 200,
            json: async () => [],
          };
        })
      );

      await getTemplates();
      expect(capturedSignal).toBeDefined();
    });
  });

  describe("trackEvent", () => {
    it("resolves even when fetch rejects (network failure)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network connection failed"))
      );

      await expect(
        trackEvent({
          eventType: "PAGE_VIEW",
          templateId: 1,
          sessionId: "sess-123",
        })
      ).resolves.toBeUndefined();
    });

    it("sends exactly three keys (eventType, templateId, sessionId)", async () => {
      let capturedBody: Record<string, unknown> | undefined;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init?: RequestInit) => {
          if (init?.body) {
            capturedBody = JSON.parse(init.body as string);
          }
          return { ok: true, status: 202 };
        })
      );

      await trackEvent({
        eventType: "TEMPLATE_CLICK",
        templateId: 7,
        sessionId: "sess-abc-456",
      });

      expect(capturedBody).toBeDefined();
      expect(Object.keys(capturedBody!).sort()).toEqual([
        "eventType",
        "sessionId",
        "templateId",
      ]);
      expect(capturedBody).toEqual({
        eventType: "TEMPLATE_CLICK",
        templateId: 7,
        sessionId: "sess-abc-456",
      });
      expect(capturedBody).not.toHaveProperty("userAgent");
      expect(capturedBody).not.toHaveProperty("referrer");
    });
  });
});

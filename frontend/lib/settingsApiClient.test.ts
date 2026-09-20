import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchSettings, saveSetting, ApiError } from "./settingsApiClient";

describe("settingsApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchSettings requests /api/admin/settings and returns settings list", async () => {
    const mockSettings = [
      { key: "site_title", valueJson: "\"My Portfolio\"", updatedAt: "2026-09-20T10:00:00Z" },
      { key: "seo_meta", valueJson: "\"Portfolio SEO\"", updatedAt: "2026-09-20T10:00:00Z" },
      { key: "social_links", valueJson: "[]", updatedAt: "2026-09-20T10:00:00Z" },
      { key: "contact_email", valueJson: "\"hello@portfolio.com\"", updatedAt: "2026-09-20T10:00:00Z" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => mockSettings,
      }))
    );

    const result = await fetchSettings();
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/admin/settings");
    expect(result).toEqual(mockSettings);
  });

  it("saveSetting sends PUT /api/admin/settings/{key} with valueJson", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => 1,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await saveSetting("contact_email", "\"hello@portfolio.com\"");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/admin/settings/contact_email");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ valueJson: "\"hello@portfolio.com\"" });
  });

  it("surfaces 403 forbidden error when user lacks ADMIN role", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({
          code: "FORBIDDEN",
          message: "Not allowed",
          requestId: "req-403",
        }),
      }))
    );

    await expect(fetchSettings()).rejects.toThrow("Not allowed");
    try {
      await fetchSettings();
      expect.unreachable("expected fetchSettings to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(403);
      expect((err as ApiError).message).toBe("Not allowed");
    }
  });

  it("surfaces server error message from body.message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({
          code: "INTERNAL_ERROR",
          message: "Database connection failed",
          requestId: "req-500",
        }),
      }))
    );

    await expect(fetchSettings()).rejects.toThrow("Database connection failed");
  });

  it("surfaces fallback error message when body has no message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }))
    );

    await expect(fetchSettings()).rejects.toThrow("Request failed (500)");
  });

  it("surfaces network failure when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network connection failed"))
    );

    await expect(fetchSettings()).rejects.toThrow("Network connection failed");
  });
});

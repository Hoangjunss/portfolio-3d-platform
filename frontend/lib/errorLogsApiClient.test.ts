import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchErrorLogs, listErrorLogs } from "./errorLogsApiClient";

describe("errorLogsApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the admin error-logs endpoint and returns typed rows on happy path", async () => {
    const mockData = {
      content: [
        {
          id: 1,
          endpoint: "/api/admin/templates",
          httpStatus: 500,
          exceptionClass: "NullPointerException",
          message: "boom",
          stacktrace: "at com.portfolio.platform...",
          requestId: "req-1",
          createdAt: "2026-09-20T10:00:00Z",
        },
      ],
      totalPages: 1,
      number: 0,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => mockData,
      }))
    );

    const page = await fetchErrorLogs(0, 20);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/admin/error-logs?page=0&size=20");
    expect(page.content[0].exceptionClass).toBe("NullPointerException");
    expect(page.content[0].id).toBe(1);
    expect(page.totalPages).toBe(1);
    expect(page.number).toBe(0);
  });

  it("surfaces server error message when request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
          requestId: "req-err-1",
        }),
      }))
    );

    await expect(fetchErrorLogs(0, 20)).rejects.toThrow("Database connection failed");
  });

  it("surfaces fallback error message when server returns no message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }))
    );

    await expect(fetchErrorLogs(0, 20)).rejects.toThrow("Request failed (500)");
  });

  it("surfaces network failure when fetch rejects using mockRejectedValue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network connection failed"))
    );

    await expect(fetchErrorLogs(0, 20)).rejects.toThrow("Network connection failed");
  });

  it("listErrorLogs defaults to page 0 and size 20 and handles unwrapPage array fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: 2,
            endpoint: "/api/admin/users",
            httpStatus: 500,
            exceptionClass: "IllegalStateException",
            message: "State error",
            stacktrace: "stack...",
            requestId: "req-2",
            createdAt: "2026-09-20T11:00:00Z",
          },
        ],
      }))
    );

    const result = await listErrorLogs();
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/admin/error-logs?page=0&size=20");
    expect(result.content.length).toBe(1);
    expect(result.content[0].endpoint).toBe("/api/admin/users");
    expect(result.totalPages).toBe(1);
    expect(result.number).toBe(0);
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { listAuditLogs } from "./auditLogApiClient";

describe("auditLogApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires an entityType and includes it in the query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ content: [], totalPages: 0 }),
      }))
    );
    await listAuditLogs("Template", undefined, 0);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain("entityType=Template");
  });

  it("listAuditLogs calls GET /api/admin/audit-logs with required entityType and page", async () => {
    const mockData = {
      content: [
        {
          id: 1,
          userId: 2,
          action: "UPDATE",
          entityType: "Template",
          entityId: 10,
          oldValueJson: '{"name":"old"}',
          newValueJson: '{"name":"new"}',
          ipAddress: "127.0.0.1",
          createdAt: "2026-09-20T12:00:00Z",
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

    const result = await listAuditLogs("Template", undefined, 0);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain("/api/admin/audit-logs?");
    expect(url).toContain("entityType=Template");
    expect(url).toContain("page=0");
    expect(result.content).toEqual(mockData.content);
    expect(result.totalPages).toBe(1);
    expect(result.number).toBe(0);
  });

  it("listAuditLogs includes entityId in query when provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ content: [], totalPages: 0 }),
      }))
    );

    await listAuditLogs("User", 7, 2);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain("entityType=User");
    expect(url).toContain("page=2");
    expect(url).toContain("entityId=7");
  });

  it("listAuditLogs surfaces server error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          code: "INVALID_REQUEST",
          message: "entityType is required",
          requestId: "req-1",
        }),
      }))
    );

    await expect(listAuditLogs("", undefined, 0)).rejects.toThrow("entityType is required");
  });

  it("listAuditLogs surfaces fallback error message when body has no message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      }))
    );

    await expect(listAuditLogs("Template", undefined, 0)).rejects.toThrow("Request failed (500)");
  });

  it("listAuditLogs surfaces network failure when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network connection failed"))
    );

    await expect(listAuditLogs("Template", undefined, 0)).rejects.toThrow("Network connection failed");
  });
});

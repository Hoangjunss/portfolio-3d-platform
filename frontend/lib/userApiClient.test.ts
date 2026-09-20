import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { listUsers, createUser, deactivateUser } from "./userApiClient";

describe("userApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listUsers calls GET /api/admin/users with the page param", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [], totalPages: 0 }),
    })));
    const result = await listUsers(0);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain("/api/admin/users?page=0");
    expect(result.content).toEqual([]);
    expect(result.totalPages).toBe(0);
  });

  it("listUsers unwraps bare array responses", async () => {
    const rawUsers = [
      {
        id: 1,
        username: "admin",
        email: "a@x.com",
        role: "ADMIN",
        active: true,
        lastLoginAt: null,
        createdAt: "2026-09-20",
      },
    ];
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => rawUsers,
    })));
    const result = await listUsers(0);
    expect(result.content).toEqual(rawUsers);
    expect(result.totalPages).toBe(1);
  });

  it("listUsers surfaces server error message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ message: "Not allowed" }),
    })));
    await expect(listUsers(0)).rejects.toThrow("Not allowed");
  });

  it("listUsers surfaces network failure when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network connection failed")));
    await expect(listUsers(0)).rejects.toThrow("Network connection failed");
  });

  it("createUser posts the form and returns the created UserDto", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 1, username: "ed", role: "EDITOR", active: true }),
    })));
    const result = await createUser({
      username: "ed",
      email: "ed@x.com",
      password: "pw123456",
      role: "EDITOR",
    });
    expect(result.id).toBe(1);
    const [url, options] = (fetch as any).mock.calls[0];
    expect(url).toContain("/api/admin/users");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      username: "ed",
      email: "ed@x.com",
      password: "pw123456",
      role: "EDITOR",
    });
  });

  it("createUser surfaces server error on duplicate user", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ message: "Username already taken" }),
    })));
    await expect(
      createUser({ username: "ed", email: "ed@x.com", password: "pw123456", role: "EDITOR" })
    ).rejects.toThrow("Username already taken");
  });

  it("createUser surfaces network failure when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network connection failed")));
    await expect(
      createUser({ username: "ed", email: "ed@x.com", password: "pw123456", role: "EDITOR" })
    ).rejects.toThrow("Network connection failed");
  });

  it("deactivateUser sends DELETE and succeeds on 204", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 204,
    })));
    await expect(deactivateUser(42)).resolves.toBeUndefined();
    const [url, options] = (fetch as any).mock.calls[0];
    expect(url).toContain("/api/admin/users/42");
    expect(options.method).toBe("DELETE");
  });

  it("deactivateUser surfaces the server's error message on 400", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ message: "Cannot deactivate the last active admin" }),
    })));
    await expect(deactivateUser(1)).rejects.toThrow("Cannot deactivate the last active admin");
  });

  it("deactivateUser surfaces network failure when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network connection failed")));
    await expect(deactivateUser(1)).rejects.toThrow("Network connection failed");
  });
});

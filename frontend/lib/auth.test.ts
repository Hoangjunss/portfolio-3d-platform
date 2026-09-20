import { describe, expect, it, beforeEach, vi } from "vitest";
import { hasValidSession, persistSession, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./auth";

// Builds a token with only the parts hasValidSession reads: a base64url payload carrying exp.
function tokenExpiringAt(epochSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ sub: "admin", exp: epochSeconds }))
    .toString("base64url");
  return `header.${payload}.signature`;
}

describe("hasValidSession", () => {
  it("returns false when no cookie is present", () => {
    expect(hasValidSession(undefined)).toBe(false);
  });

  it("returns false when the cookie is empty", () => {
    expect(hasValidSession("")).toBe(false);
  });

  it("returns true for a token that has not expired yet", () => {
    expect(hasValidSession(tokenExpiringAt(Math.floor(Date.now() / 1000) + 600))).toBe(true);
  });

  it("returns false for an expired token", () => {
    expect(hasValidSession(tokenExpiringAt(Math.floor(Date.now() / 1000) - 60))).toBe(false);
  });

  it("returns false for a token with no exp claim", () => {
    const payload = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
    expect(hasValidSession(`header.${payload}.signature`)).toBe(false);
  });

  it("returns false for a malformed token instead of throwing", () => {
    expect(hasValidSession("not-a-jwt")).toBe(false);
    expect(hasValidSession("a.!!!not-base64!!!.c")).toBe(false);
  });
});

describe("persistSession", () => {
  let written: string[];

  beforeEach(() => {
    written = [];
    vi.stubGlobal("document", {
      set cookie(value: string) {
        written.push(value);
      },
      get cookie() {
        return written.join("; ");
      },
    });
  });

  it("stores both tokens", () => {
    persistSession({ accessToken: "a.b.c", refreshToken: "r.s.t" });
    expect(written.some((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=a.b.c`))).toBe(true);
    expect(written.some((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=r.s.t`))).toBe(true);
  });

  it("gives the refresh cookie a longer life than the access cookie", () => {
    persistSession({ accessToken: "a.b.c", refreshToken: "r.s.t" });
    const maxAge = (name: string) =>
      Number(written.find((c) => c.startsWith(name))!.match(/max-age=(\d+)/)![1]);
    expect(maxAge(REFRESH_TOKEN_COOKIE)).toBeGreaterThan(maxAge(ACCESS_TOKEN_COOKIE));
  });

  it("rejects a response that is missing either token", () => {
    expect(() => persistSession({ accessToken: "a.b.c" } as never)).toThrow();
    expect(() => persistSession({ refreshToken: "r.s.t" } as never)).toThrow();
  });
});


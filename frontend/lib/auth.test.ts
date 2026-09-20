import { describe, expect, it } from "vitest";
import { hasValidSession } from "./auth";

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

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function requestFor(path: string, token?: string): NextRequest {
  const request = new NextRequest(new URL(path, "http://localhost:3000"));
  if (token !== undefined) {
    request.cookies.set("portfolio_access_token", token);
  }
  return request;
}

function validToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + 600 }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

describe("middleware", () => {
  it("redirects an unauthenticated /admin request to /admin/login", () => {
    const res = middleware(requestFor("/admin"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("redirects an unauthenticated nested admin route too", () => {
    const res = middleware(requestFor("/admin/templates"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("redirects when the token is present but expired", () => {
    const expired = `header.${Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }),
    ).toString("base64url")}.signature`;
    const res = middleware(requestFor("/admin", expired));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("lets an authenticated admin request through", () => {
    const res = middleware(requestFor("/admin/templates", validToken()));
    expect(res.headers.get("location")).toBeNull();
  });

  it("never redirects /admin/login itself, even with no cookie", () => {
    const res = middleware(requestFor("/admin/login"));
    expect(res.headers.get("location")).toBeNull();
  });
});

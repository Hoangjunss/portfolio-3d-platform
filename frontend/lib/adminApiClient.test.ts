import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { adminFetch, unwrapPage } from "./adminApiClient";

function cookieJar(initial: string) {
  let jar = initial;
  return {
    get cookie() {
      return jar;
    },
    set cookie(v: string) {
      jar = `${jar}; ${v}`;
    },
  };
}

describe("adminFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("document", cookieJar("portfolio_access_token=abc.def.ghi"));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("attaches the access token as a Bearer header", async () => {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch("/api/admin/templates");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get("Authorization")).toBe("Bearer abc.def.ghi");
  });

  it("retries once through /api/auth/refresh after a 401, then replays the request", async () => {
    vi.stubGlobal("document", cookieJar(
      "portfolio_access_token=stale; portfolio_refresh_token=r.s.t",
    ));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: "new.a.b", refreshToken: "new.r.s" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await adminFetch("/api/admin/templates");

    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[1][0]).toContain("/api/auth/refresh");
    const replayed = fetchMock.mock.calls[2][1] as RequestInit;
    expect(new Headers(replayed.headers).get("Authorization")).toBe("Bearer new.a.b");
  });

  it("gives up after one failed refresh instead of looping", async () => {
    vi.stubGlobal("document", cookieJar(
      "portfolio_access_token=stale; portfolio_refresh_token=r.s.t",
    ));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await adminFetch("/api/admin/templates");

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not attempt a refresh when there is no refresh token", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch("/api/admin/templates");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("unwrapPage", () => {
  it("returns content from a Spring Page envelope", () => {
    expect(unwrapPage({ content: [{ id: 1 }], totalElements: 1 })).toEqual([{ id: 1 }]);
  });

  it("returns an empty array for a body that is not a page", () => {
    expect(unwrapPage({ error: "UNAUTHORIZED" })).toEqual([]);
    expect(unwrapPage(null)).toEqual([]);
  });
});

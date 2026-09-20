import { describe, expect, it, vi, beforeEach } from "vitest";
import { getContentSection } from "./contentClient";

describe("getContentSection", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ sectionKey: "hero", dataJson: { headline: "Custom headline" } }) }))
    );
  });

  it("returns the parsed dataJson on success", async () => {
    const data = await getContentSection<{ headline: string }>("hero");
    expect(data?.headline).toBe("Custom headline");
  });

  it("returns null when the section does not exist (404)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    const data = await getContentSection("hero");
    expect(data).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("fetch failed");
      })
    );
    const data = await getContentSection("hero");
    expect(data).toBeNull();
  });
});

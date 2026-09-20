import { describe, expect, it, vi } from "vitest";
import { submitLead } from "./leadClient";

describe("submitLead", () => {
  it("returns ok:true on 201", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 201 })));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: true });
  });

  it("returns a rate-limit result on 429", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429 })));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: false, reason: "rate-limited" });
  });

  it("returns a server-error result on 5xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: false, reason: "server-error" });
  });

  it("returns a network result when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: false, reason: "network" });
  });
});

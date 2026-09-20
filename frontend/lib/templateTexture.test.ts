import { describe, expect, it } from "vitest";
import { shouldRenderTexture } from "./templateTexture";

describe("shouldRenderTexture", () => {
  it("is true when thumbnailUrl is a non-empty string", () => {
    expect(shouldRenderTexture("https://example.com/a.webp")).toBe(true);
  });

  it("is false when thumbnailUrl is null", () => {
    expect(shouldRenderTexture(null)).toBe(false);
  });

  it("is false when thumbnailUrl is an empty string", () => {
    expect(shouldRenderTexture("")).toBe(false);
  });
});

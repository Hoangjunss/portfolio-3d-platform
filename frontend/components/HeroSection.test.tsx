// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

vi.mock("@/lib/contentClient", () => ({ getContentSection: vi.fn(async () => null) }));

describe("HeroSection", () => {
  it("renders the fallback headline when no CMS content exists", async () => {
    render(await HeroSection());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "See your site before you build it."
    );
  });
});

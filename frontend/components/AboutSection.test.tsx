// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AboutSection } from "./AboutSection";

vi.mock("@/lib/contentClient", () => ({ getContentSection: vi.fn(async () => null) }));

describe("AboutSection", () => {
  afterEach(cleanup);

  it("renders the fallback heading and does not fabricate any metric", async () => {
    render(await AboutSection());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Một xưởng, hai mươi bản thiết kế."
    );
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders the caption in the narrow left margin", async () => {
    render(await AboutSection());
    expect(screen.getByText("Est. cho 20 mẫu website")).toBeInTheDocument();
  });
});

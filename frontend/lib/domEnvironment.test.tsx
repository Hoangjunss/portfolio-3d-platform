// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Guards the per-file opt-in itself: if the docblock, the jest-dom import or either package
// regresses, this fails before any feature test has a chance to fail confusingly.
describe("DOM test environment", () => {
  it("renders into a real document and exposes jest-dom matchers", () => {
    render(<p>xin chào</p>);
    expect(screen.getByText("xin chào")).toBeInTheDocument();
  });
});

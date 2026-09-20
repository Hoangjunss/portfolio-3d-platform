// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicesSection } from "./ServicesSection";

vi.mock("@/lib/contentClient", () => ({ getContentSection: vi.fn(async () => null) }));

describe("ServicesSection", () => {
  it("renders three numbered steps in the fixed fallback order", async () => {
    render(await ServicesSection());
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("01");
    expect(steps[0]).toHaveTextContent("Xem trước trong 3D");
    expect(steps[2]).toHaveTextContent("Ra mắt trên subdomain của bạn");
  });
});

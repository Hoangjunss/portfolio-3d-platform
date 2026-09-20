// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevealOnScroll } from "./RevealOnScroll";

class MockObserver {
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
  }
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as any);
  }
  unobserve() {}
  disconnect() {}
}

describe("RevealOnScroll", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockObserver as any);
  });

  it("adds the is-visible class once the observer reports intersection", () => {
    render(
      <RevealOnScroll index={2}>
        <p>Content</p>
      </RevealOnScroll>
    );
    const wrapper = screen.getByText("Content").parentElement;
    expect(wrapper).toHaveClass("is-visible");
    expect(wrapper).toHaveStyle({ "--i": "2" } as any);
  });
});

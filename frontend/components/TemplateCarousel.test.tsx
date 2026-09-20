import React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TemplateCarousel } from "./TemplateCarousel";
import type { Template } from "@/lib/apiClient";
import * as apiClient from "@/lib/apiClient";
import * as sessionLib from "@/lib/session";
import * as webglLib from "@/lib/webgl";

const mockTemplate1: Template = {
  id: 42, // Non-zero ID to distinguish from index 0 for M7
  name: "Restaurant Deluxe",
  slug: "restaurant-deluxe",
  subdomain: "restaurant-demo",
  thumbnailMediaId: 10,
  thumbnailUrl: "https://example.com/thumbnails/restaurant.webp",
  description: "Modern dining template",
  category: "Restaurant",
  techTags: "React, Three.js",
  displayOrder: 1,
  active: true,
  viewCount: 10,
  clickCount: 5,
};

const mockTemplate2: Template = {
  id: 99,
  name: "Creative Agency",
  slug: "creative-agency",
  subdomain: "agency-demo",
  thumbnailMediaId: null,
  thumbnailUrl: null, // Test null thumbnail for Decision (i) and M8
  description: "Minimal agency portfolio",
  category: "Agency",
  techTags: "Next.js",
  displayOrder: 2,
  active: true,
  viewCount: 20,
  clickCount: 8,
};

// Test runner helper to mount client component in Node and run useEffect
function mountClientComponent<P extends object>(
  Component: React.ComponentType<P>,
  props: P
) {
  const stateMap = new Map<number, unknown>();
  let stateIndex = 0;
  const refMap = new Map<number, unknown>();
  let refIndex = 0;
  const effects: (() => void)[] = [];

  const internals = (React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: {
      H: unknown;
    };
  }).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const originalDispatcher = internals.H;

  const testDispatcher = {
    useState: (init: unknown) => {
      const idx = stateIndex++;
      if (!stateMap.has(idx)) {
        stateMap.set(idx, typeof init === "function" ? (init as () => unknown)() : init);
      }
      const setState = (newVal: unknown) => {
        stateMap.set(
          idx,
          typeof newVal === "function"
            ? (newVal as (prev: unknown) => unknown)(stateMap.get(idx))
            : newVal
        );
      };
      return [stateMap.get(idx), setState];
    },
    useRef: (init: unknown) => {
      const idx = refIndex++;
      if (!refMap.has(idx)) {
        refMap.set(idx, { current: init });
      }
      return refMap.get(idx);
    },
    useEffect: (effect: () => void) => {
      effects.push(effect);
    },
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
  };

  internals.H = testDispatcher;
  let element: React.ReactElement | null = null;
  try {
    element = (Component as (props: P) => React.ReactElement)(props);
  } finally {
    internals.H = originalDispatcher;
  }

  // Run mount effects
  effects.forEach((fn) => fn());

  return { element, runEffects: () => effects.forEach((fn) => fn()) };
}

describe("TemplateCarousel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the 2D list without a WebGL context on server render", () => {
    vi.spyOn(webglLib, "isWebGLAvailable").mockReturnValue(false);
    const html = renderToString(
      React.createElement(TemplateCarousel, {
        templates: [mockTemplate1, mockTemplate2],
      })
    );

    // Decision (h) & Mutation M6: Server must render the 2D carousel, not empty/null
    expect(html).toContain("Restaurant Deluxe");
    expect(html).toContain("Creative Agency");
  });

  it("renders a card whose thumbnailUrl is null without throwing", () => {
    expect(() =>
      renderToString(
        React.createElement(TemplateCarousel, {
          templates: [mockTemplate2],
        })
      )
    ).not.toThrow();

    const html = renderToString(
      React.createElement(TemplateCarousel, {
        templates: [mockTemplate2],
      })
    );
    // Decision (i) & Mutation M8: Renders placeholder without crashing
    expect(html).toContain("Creative Agency");
  });

  it("fires exactly one PAGE_VIEW on mount", () => {
    const trackSpy = vi.spyOn(apiClient, "trackEvent").mockResolvedValue();
    vi.spyOn(sessionLib, "getSessionId").mockReturnValue("sess-uuid-1234");
    vi.spyOn(webglLib, "isWebGLAvailable").mockReturnValue(false);

    const { runEffects } = mountClientComponent(TemplateCarousel, {
      templates: [mockTemplate1],
    });

    // Decision (g) & Mutation M5: Must fire PAGE_VIEW on mount
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith({
      eventType: "PAGE_VIEW",
      sessionId: "sess-uuid-1234",
    });

    // StrictMode / extra render simulation: must still be exactly one PAGE_VIEW
    runEffects();
    expect(trackSpy).toHaveBeenCalledTimes(1);
  });

  it("fires TEMPLATE_CLICK with the right templateId on select", () => {
    const trackSpy = vi.spyOn(apiClient, "trackEvent").mockResolvedValue();
    vi.spyOn(sessionLib, "getSessionId").mockReturnValue("sess-uuid-1234");
    vi.spyOn(webglLib, "isWebGLAvailable").mockReturnValue(false);

    const { element } = mountClientComponent(TemplateCarousel, {
      templates: [mockTemplate1, mockTemplate2],
    });

    // The 2D carousel is the first child of the fragment
    const carousel2D = (element?.props as { children: React.ReactElement[] }).children[0];
    expect(carousel2D).toBeDefined();

    // Select the first template (id is 42, array index is 0)
    (carousel2D.props as { onSelect: (template: Template) => void }).onSelect(mockTemplate1);

    // Decision (g) & Mutation M7: Must pass template.id (42), not array index (0)
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "TEMPLATE_CLICK",
        templateId: 42,
        sessionId: "sess-uuid-1234",
      })
    );
  });
});

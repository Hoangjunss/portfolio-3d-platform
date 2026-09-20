import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteNav } from "./SiteNav";

describe("SiteNav", () => {
  it("renders the wordmark and a CTA linking to the templates section", () => {
    const html = renderToString(<SiteNav />);
    expect(html).toContain("PORTFOLIO");
    expect(html).toContain('href="#templates"');
    expect(html).toContain("Xem template");
  });

  // N9 is defined by the absence of a nav-link row, so the count is the assertion.
  it("renders exactly one anchor", () => {
    const html = renderToString(<SiteNav />);
    expect(html.match(/<a\s/g) ?? []).toHaveLength(1);
  });
});

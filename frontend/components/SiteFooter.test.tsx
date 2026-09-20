import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders the wordmark, the admin login link, and the contact anchor", () => {
    const html = renderToString(<SiteFooter />);
    expect(html).toContain("PORTFOLIO");
    expect(html).toContain('href="/admin/login"');
    expect(html).toContain("Đăng nhập quản trị");
    expect(html).toContain('href="#contact"');
    expect(html).toContain("Liên hệ");
  });

  it("does not render a social icon row (none exist yet)", () => {
    const html = renderToString(<SiteFooter />);
    expect(html).not.toContain("<ul");
  });
});

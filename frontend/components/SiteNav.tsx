"use client";

import { useEffect, useState } from "react";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[var(--z-sticky)] flex items-center justify-between px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-md)] transition-colors"
      style={{
        backgroundColor: scrolled ? "var(--color-paper)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--color-rule)" : "1px solid transparent",
        transitionDuration: "var(--dur-short)",
        transitionTimingFunction: "var(--ease-out)",
      }}
    >
      <span
        className="uppercase"
        style={{ fontFamily: "var(--font-wordmark)", letterSpacing: "0.08em", fontSize: "var(--text-sm)" }}
      >
        PORTFOLIO
      </span>
      <a
        href="#templates"
        className="min-h-[44px] min-w-[44px] flex items-center"
        style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)", borderBottom: "1px solid var(--color-accent)" }}
      >
        Xem template
      </a>
    </nav>
  );
}

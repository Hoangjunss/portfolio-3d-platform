"use client";

import { useEffect, useRef, useState } from "react";

export function RevealOnScroll({
  children,
  index = 0,
}: {
  children: React.ReactNode;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

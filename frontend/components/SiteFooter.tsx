export function SiteFooter() {
  return (
    <footer
      className="flex flex-col gap-[var(--space-md)] px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-2xl)] sm:flex-row sm:items-baseline sm:justify-between"
      style={{ borderTop: "1px solid var(--color-rule)" }}
    >
      <div className="flex flex-col gap-[var(--space-xs)]">
        <span
          className="uppercase"
          style={{ fontFamily: "var(--font-wordmark)", letterSpacing: "0.08em", fontSize: "var(--text-sm)" }}
        >
          PORTFOLIO
        </span>
        <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--color-muted)" }}>
          Một xưởng, hai mươi bản thiết kế.
        </p>
      </div>
      <div className="flex gap-[var(--space-lg)]">
        <a href="/admin/login" style={{ color: "var(--color-ink)" }}>
          Đăng nhập quản trị
        </a>
        <a href="#contact" style={{ color: "var(--color-ink)" }}>
          Liên hệ
        </a>
      </div>
      <p
        className="uppercase"
        style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", color: "var(--color-muted)" }}
      >
        © {new Date().getFullYear()} Portfolio
      </p>
    </footer>
  );
}

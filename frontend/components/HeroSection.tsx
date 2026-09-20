import { getContentSection } from "@/lib/contentClient";

const FALLBACK_HEADLINE = "See your site before you build it.";

export async function HeroSection() {
  const content = await getContentSection<{ headline?: string }>("hero");
  const headline = content?.headline || FALLBACK_HEADLINE;

  return (
    <section className="flex min-h-screen flex-col justify-end px-[clamp(1rem,4vw,1.5rem)] pb-[var(--space-3xl)]">
      <h1
        className="max-w-[16ch]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          overflowWrap: "anywhere",
          color: "var(--color-ink)",
        }}
      >
        {headline}
      </h1>
      <hr style={{ borderTop: "2px solid var(--color-rule)", marginTop: "var(--space-2xl)" }} />
    </section>
  );
}

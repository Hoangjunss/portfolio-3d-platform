import { getContentSection } from "@/lib/contentClient";
import { RevealOnScroll } from "./RevealOnScroll";

const FALLBACK_HEADING = "Một xưởng, hai mươi bản thiết kế.";
const FALLBACK_BODY =
  "Hai mươi mẫu website được thiết kế thủ công, trưng bày chung trong một trải nghiệm 3D. " +
  "Mỗi mẫu vận hành trên cùng một hệ thống quản trị Spring Boot — không cần chỉnh sửa cơ sở dữ liệu tay.";

export async function AboutSection() {
  const content = await getContentSection<{ heading?: string; body?: string }>("about");

  return (
    <RevealOnScroll index={1}>
      <section
        id="about"
        className="grid grid-cols-1 gap-[var(--space-lg)] px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-3xl)] md:grid-cols-[16ch_minmax(0,65ch)]"
      >
        <p
          className="uppercase"
          style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", color: "var(--color-muted)" }}
        >
          Est. cho 20 mẫu website
        </p>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              color: "var(--color-ink)",
              marginBottom: "var(--space-md)",
            }}
          >
            {content?.heading || FALLBACK_HEADING}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)", maxWidth: "65ch" }}>
            {content?.body || FALLBACK_BODY}
          </p>
        </div>
      </section>
    </RevealOnScroll>
  );
}

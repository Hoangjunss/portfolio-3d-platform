import { getContentSection } from "@/lib/contentClient";
import { RevealOnScroll } from "./RevealOnScroll";

const FALLBACK_STEPS = [
  { title: "Xem trước trong 3D", body: "Duyệt qua carousel, mở bản demo thật trong tab mới." },
  { title: "Chọn & tuỳ biến nội dung", body: "Chọn một mẫu, yêu cầu chỉnh nội dung/thương hiệu qua đội quản trị." },
  { title: "Ra mắt trên subdomain của bạn", body: "Vận hành trên cùng hệ thống quản trị Spring Boot đang chạy nền tảng này." },
];

export async function ServicesSection() {
  const content = await getContentSection<{ steps?: typeof FALLBACK_STEPS }>("services");
  const steps = content?.steps?.length ? content.steps : FALLBACK_STEPS;

  return (
    <RevealOnScroll index={2}>
      <section id="services" className="px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-3xl)]">
        <h2
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-ink)", marginBottom: "var(--space-xl)" }}
        >
          Cách chúng tôi làm việc
        </h2>
        <ol className="flex flex-col gap-[var(--space-xl)]">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-[var(--space-xs)] sm:flex-row sm:gap-[var(--space-lg)]">
              <span
                style={{ fontFamily: "var(--font-wordmark)", color: "var(--color-accent)", fontSize: "var(--text-sm)", minWidth: "2ch" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{step.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", maxWidth: "65ch" }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </RevealOnScroll>
  );
}

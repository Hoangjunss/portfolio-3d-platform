import { getTemplates, type Template } from "@/lib/apiClient";
import { TemplateCarousel } from "@/components/TemplateCarousel";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ContactForm } from "@/components/ContactForm";

export default async function HomePage() {
  let templates: Template[] = [];
  try {
    templates = await getTemplates();
  } catch {
    // Decision (j): Backend down must not blank the page; render shell and empty state
    templates = [];
  }

  return (
    <main>
      <HeroSection />
      <section id="templates">
        <TemplateCarousel templates={templates} />
      </section>
      <AboutSection />
      <ServicesSection />
      <section id="contact" className="px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-3xl)] md:grid md:grid-cols-[minmax(0,40ch)_minmax(0,480px)] md:gap-[var(--space-2xl)]">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-ink)" }}>
            Nói chuyện với chúng tôi
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}>
            Điền thông tin, chúng tôi phản hồi trong 1 ngày làm việc.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}

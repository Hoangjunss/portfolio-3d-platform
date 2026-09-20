import { getTemplates, type Template } from "@/lib/apiClient";
import { TemplateCarousel } from "@/components/TemplateCarousel";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";

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
    </main>
  );
}

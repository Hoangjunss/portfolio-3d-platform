import { getTemplates, type Template } from "@/lib/apiClient";
import { TemplateCarousel } from "@/components/TemplateCarousel";

export default async function HomePage() {
  let templates: Template[] = [];
  try {
    templates = await getTemplates();
  } catch {
    // Decision (j): Backend down must not blank the page; render shell and empty state
    templates = [];
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <div className="w-full">
        <header className="pt-12 pb-6 px-4 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Portfolio 3D Platform
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Explore our curated showcase of responsive, 3D-accelerated website templates.
          </p>
        </header>

        <section className="w-full py-4">
          <TemplateCarousel templates={templates} />
        </section>
      </div>

      <footer className="py-6 px-4 text-center text-xs text-slate-600 border-t border-slate-900">
        &copy; {new Date().getFullYear()} Portfolio Platform. All rights reserved.
      </footer>
    </main>
  );
}

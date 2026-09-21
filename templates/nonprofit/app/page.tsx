import { Hero, ItemGrid, StatBlock, Footer, type FooterLink } from '@portfolio/template-kit';
import { CAUSES, IMPACT_STATS } from '../data/seed';

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Programs', href: '#programs' },
  { label: 'Impact', href: '#impact' },
  { label: 'Pledge', href: '#pledge' },
];

export default function NonprofitPage() {
  return (
    <main>
      <Hero
        headline="Mái Ấm Bình Minh Foundation"
        subhead="Scholarships, nutrition, and emergency support for children and families across rural Vietnam."
        ctaLabel="Make a pledge"
        ctaHref="#pledge"
      />
      <section id="programs" className="doc-section">
        <h2>Our Programs</h2>
        <p>Scholarships, nutrition, healthcare, and community support across rural provinces.</p>
        <ItemGrid items={CAUSES} columns={3} />
      </section>
      <section id="impact" className="doc-section">
        <h2>Illustrative Impact</h2>
        <p>Example metrics demonstrating potential reach across supported regions.</p>
        <StatBlock stats={IMPACT_STATS} />
        <p className="stat-disclaimer">
          These are illustrative example figures for a fictional organisation, authored for this demo scaffold only, and are not actual claims about any real charity.
        </p>
      </section>
      <section id="pledge" className="doc-section">
        {/* Interactive pledge section wired in Task 3 */}
      </section>
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

import { Footer, Hero, ItemGrid, StatBlock } from '@portfolio/template-kit';
import { FEATURES, INTEGRATIONS, STATS } from '../data/seed';
import { PricedItemGridSection } from './PricedItemGridSection';

export default function Page() {
  return (
    <main>
      <Hero headline="Make the handoffs disappear." subhead="Loopwire turns the work between your tools into a visible, dependable system." ctaLabel="See pricing" ctaHref="#pricing" />
      <section className="saas-section" aria-labelledby="features-heading">
        <div className="saas-heading"><p>Workflow, without the waiting.</p><h2 id="features-heading">Every handoff has a home.</h2></div>
        <ItemGrid items={FEATURES} columns={3} />
      </section>
      <PricedItemGridSection />
      <section className="saas-stat-section" aria-label="Illustrative demo figures"><StatBlock stats={STATS} /></section>
      <section className="saas-section saas-integrations" aria-labelledby="integrations-heading">
        <div className="saas-heading"><p>Keep your stack intact.</p><h2 id="integrations-heading">Works with the tools you already use.</h2></div>
        <ItemGrid items={INTEGRATIONS} columns={6} />
      </section>
      <Footer links={[{ label: 'Product', href: '#features-heading' }, { label: 'Pricing', href: '#pricing' }, { label: 'Docs', href: '#features-heading' }, { label: 'Contact', href: '#pricing' }]} showSocial />
    </main>
  );
}

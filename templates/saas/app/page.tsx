import { Footer, Hero, ItemGrid, StatBlock } from '@portfolio/template-kit';
import { FEATURES, STATS } from '../data/seed';
import { PricedItemGridSection } from './PricedItemGridSection';
import { IntegrationsSection } from './IntegrationsSection';
import { SiteNav } from './SiteNav';

export default function Page() {
  return (
    <main id="top">
      <SiteNav />
      <Hero headline="Make the handoffs disappear." subhead="Loopwire turns the work between your tools into a visible, dependable system." ctaLabel="See pricing" ctaHref="#pricing" />
      <section className="saas-section" aria-labelledby="features-heading">
        <div className="saas-heading"><p>Workflow, without the waiting.</p><h2 id="features-heading">Every handoff has a home.</h2></div>
        <ItemGrid items={FEATURES} columns={3} />
      </section>
      <PricedItemGridSection />
      <section className="saas-stat-section" aria-label="Illustrative demo figures"><StatBlock stats={STATS} /></section>
      <IntegrationsSection />
      <Footer links={[{ label: 'Product', href: '#features-heading' }, { label: 'Pricing', href: '#pricing' }, { label: 'Docs', href: '#features-heading' }, { label: 'Contact', href: '#pricing' }]} showSocial />
    </main>
  );
}

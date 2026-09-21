import { Footer, Hero, ItemGrid } from '@portfolio/template-kit';
import { WorkSection } from './WorkSection';
import { CAPABILITIES } from '../data/capabilities';
import { WORK_ITEMS } from '../data/work';

export default function Page() {
  return (
    <main>
      <Hero headline="Brand and product work that earns its keep" subhead="A small studio for identity, product design, and the film work that ties them together." ctaLabel="See our work" ctaHref="#work" />
      <WorkSection items={WORK_ITEMS} />
      <section className="agency-capabilities" aria-labelledby="capabilities-heading">
        <div className="agency-section-heading"><h2 id="capabilities-heading">From the first question to the final frame.</h2></div>
        <ItemGrid items={CAPABILITIES} columns={4} />
      </section>
      <Footer links={[{ label: 'Contact', href: '#contact' }]} showSocial />
    </main>
  );
}

import { Footer, ItemGrid } from '@portfolio/template-kit';
import { StudioHero } from './StudioHero';
import { WorkSection } from './WorkSection';
import { CAPABILITIES } from '../data/capabilities';
import { WORK_ITEMS } from '../data/work';

export default function Page() {
  return (
    <main>
      <StudioHero />
      <WorkSection items={WORK_ITEMS} />
      <section id="capabilities" className="agency-capabilities" aria-labelledby="capabilities-heading">
        <div className="agency-section-heading"><h2 id="capabilities-heading">From the first question to the final frame.</h2></div>
        <ItemGrid items={CAPABILITIES} columns={4} />
      </section>
      <Footer links={[{ label: 'Contact', href: '#contact' }]} showSocial />
    </main>
  );
}

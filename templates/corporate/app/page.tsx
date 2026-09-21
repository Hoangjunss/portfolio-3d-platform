import { Hero, ItemGrid, PeopleGrid, Footer } from '@portfolio/template-kit';
import { SERVICES, LEADERSHIP } from '../data/seed';

const FOOTER_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Careers', href: '#careers' },
  { label: 'Contact', href: '#callback' },
];

export default function CorporatePage() {
  return (
    <main>
      <Hero
        headline="Strategic advisory for enterprise scale and sustainable growth."
        subhead="Thăng Long Consulting Group partners with forward-looking executives to navigate market expansion, financial optimization, and institutional transformation."
        ctaLabel="Request a callback"
        ctaHref="#callback"
      />

      {/* Task 3 interactive feature slot: CallbackSection */}
      <div id="callback" />

      <section id="services">
        <ItemGrid items={SERVICES} columns={3} />
      </section>

      <section id="leadership">
        <PeopleGrid people={LEADERSHIP} roleLabel="Leadership Team" />
      </section>

      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

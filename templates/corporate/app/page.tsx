import { PeopleGrid, Footer } from '@portfolio/template-kit';
import { CorporateNav } from './CorporateNav';
import { CorporateHero } from './CorporateHero';
import { ServicesLedger } from './ServicesLedger';
import { CallbackSection } from './CallbackSection';
import { SERVICES, LEADERSHIP } from '../data/seed';

const FOOTER_LINKS = [
  { label: 'About', href: '#services' },
  { label: 'Services', href: '#services' },
  { label: 'Leadership', href: '#leadership' },
  { label: 'Contact', href: '#callback' },
];

const [LEAD_SERVICE, ...OTHER_SERVICES] = SERVICES;

export default function CorporatePage() {
  return (
    <main>
      <CorporateNav />

      <CorporateHero
        eyebrow="Advisory dossier — est. 2014"
        headline="Strategic advisory for enterprise scale and sustainable growth."
        subhead="Thăng Long Consulting Group partners with forward-looking executives to navigate market expansion, financial optimization, and institutional transformation."
        ctaLabel="Request a callback"
        ctaHref="#callback"
        credentials="Hà Nội · Registered advisory practice"
      />

      <ServicesLedger eyebrow="Practice areas" lead={LEAD_SERVICE} rest={OTHER_SERVICES} />

      <CallbackSection />

      <section id="leadership">
        <PeopleGrid people={LEADERSHIP} roleLabel="Leadership Team" />
      </section>

      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

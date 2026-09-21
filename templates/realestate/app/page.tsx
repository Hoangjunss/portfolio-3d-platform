import { Hero } from '@portfolio/template-kit/src/components/Hero';
import { ItemGrid } from '@portfolio/template-kit/src/components/ItemGrid';
import { Footer } from '@portfolio/template-kit/src/components/Footer';
import { agency, LISTINGS, toGridItem } from '../data/seed';
import { SaveListingsSection } from './SaveListingsSection';
import { InquirySection } from './InquirySection';
import { SiteNav } from './SiteNav';

const FOOTER_LINKS = [
  { label: 'Listings', href: '#listings' },
  { label: 'About', href: '#about' },
  { label: 'Agents', href: '#agents' },
  { label: 'Contact', href: '#contact' },
];

export default function RealEstatePage() {
  return (
    <main id="top">
      <SiteNav wordmark={agency.name} />
      <Hero
        headline={agency.name}
        subhead={agency.tagline}
        ctaLabel="View listings"
        ctaHref="#listings"
      />

      <div id="saved-listings">
        <SaveListingsSection />
      </div>

      <section id="listings" aria-label="Property listings">
        <ItemGrid items={LISTINGS.map(toGridItem)} columns={3} />
      </section>

      <InquirySection />

      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

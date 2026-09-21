import { Hero, PhotoGallery, Footer } from '@portfolio/template-kit';
import { WEDDING, PHOTOS } from '../data/seed';
import { WeddingCountdown } from './WeddingCountdown';
import { RsvpSection } from './RsvpSection';

const FOOTER_LINKS = [
  { label: 'Ảnh cưới', href: '#gallery' },
  { label: 'RSVP', href: '#rsvp' },
];

export default function WeddingPage() {
  return (
    <main>
      <Hero
        headline={`${WEDDING.partnerOneName} & ${WEDDING.partnerTwoName}`}
        subhead={`20 tháng 12, 2026 · ${WEDDING.venueName}, TP. Thủ Đức`}
        ctaLabel="RSVP now"
        ctaHref="#rsvp"
      />
      <WeddingCountdown />
      <section id="gallery" aria-label="Ảnh cưới">
        <PhotoGallery photos={PHOTOS} layout="grid" lightbox={true} />
      </section>
      <RsvpSection />
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

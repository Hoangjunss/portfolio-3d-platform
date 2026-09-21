import {
  Hero,
  ItemGrid,
  Footer,
  type FooterLink,
} from '@portfolio/template-kit';
import {
  ROOMS,
  AMENITIES,
  MAP_PLACEHOLDER_CAPTION,
  BOOKING_INQUIRY_FIELDS,
} from '../data/seed';
import { TripPlannerSection } from './TripPlannerSection';
import { BookingSection } from './BookingSection';

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Rooms & Packages', href: '#rooms' },
  { label: 'Amenities', href: '#amenities' },
  { label: 'Booking Inquiry', href: '#booking' },
];

export default function TravelPage() {
  return (
    <main>
      <Hero
        headline="Vịnh Ngọc Resort & Spa"
        subhead="A coastal sanctuary on Vịnh Ngọc Bay, Khánh Hòa — where peaceful waters meet refined hospitality."
        ctaLabel="Check availability"
        ctaHref="#booking"
      />
      <TripPlannerSection rooms={ROOMS} />
      <section id="amenities" className="bento-section">
        <h2>Resort Amenities</h2>
        <ItemGrid items={AMENITIES} columns={3} />
        <figure className="map-placeholder">
          <figcaption>{MAP_PLACEHOLDER_CAPTION}</figcaption>
        </figure>
      </section>
      <BookingSection fields={BOOKING_INQUIRY_FIELDS} />
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

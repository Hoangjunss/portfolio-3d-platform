'use client';

import {
  Hero,
  ItemGrid,
  InquiryForm,
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

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Rooms & Packages', href: '#rooms' },
  { label: 'Amenities', href: '#amenities' },
  { label: 'Booking Inquiry', href: '#booking' },
];

export default function TravelPage() {
  async function handleBookingSubmit(_values: Record<string, string>) {
    // Booking inquiry submission flow per spec §5: uses InquiryForm's existing pending/success state
  }

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
      <section id="booking" className="bento-section">
        <h2>Booking Inquiry</h2>
        <InquiryForm
          fields={BOOKING_INQUIRY_FIELDS}
          submitLabel="Send booking inquiry"
          onSubmit={handleBookingSubmit}
        />
      </section>
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

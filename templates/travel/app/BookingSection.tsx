'use client';

import { InquiryForm, type InquiryField } from '@portfolio/template-kit';

export interface BookingSectionProps {
  fields: InquiryField[];
}

/**
 * The booking form needs a submit handler, and a handler cannot be passed from a server component.
 * Keeping it here rather than in page.tsx is what lets page.tsx stay a server component, per the
 * render-pattern rule: static content renders directly from seed data, only the interactive part
 * is client-side. Putting the handler on the page turned the whole site -- hero, rooms, amenities,
 * map, footer -- into client JS.
 */
export function BookingSection({ fields }: BookingSectionProps) {
  // No backend exists for this demo, so submitting only exercises InquiryForm's own pending and
  // success states. It is presentational by design, not an unfinished integration.
  async function handleSubmit(_values: Record<string, string>) {
    return;
  }

  return (
    <section id="booking" className="bento-section">
      <h2>Booking Inquiry</h2>
      <InquiryForm fields={fields} submitLabel="Send booking inquiry" onSubmit={handleSubmit} />
    </section>
  );
}

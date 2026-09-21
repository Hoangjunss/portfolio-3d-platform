'use client';
import { InquiryForm } from '@portfolio/template-kit/src/components/InquiryForm';
import { INQUIRY_EXTRA_FIELDS } from '../data/seed';

export function InquirySection() {
  async function handleSubmit(values: Record<string, string>) {
    // Inquiry submission handler
  }

  return (
    <section id="contact" aria-label="Contact and inquiry">
      <InquiryForm
        fields={INQUIRY_EXTRA_FIELDS}
        submitLabel="Talk to an agent"
        onSubmit={handleSubmit}
      />
    </section>
  );
}

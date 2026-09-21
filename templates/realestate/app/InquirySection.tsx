'use client';
import { InquiryForm } from '@portfolio/template-kit/src/components/InquiryForm';
import { useLocalCollection } from '@portfolio/template-kit/src/useLocalCollection';
import { INQUIRY_EXTRA_FIELDS } from '../data/seed';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  message: string;
  submittedAt: string;
}

export function InquirySection() {
  const { add } = useLocalCollection<Inquiry>('realestate-inquiries', []);

  async function handleSubmit(values: Record<string, string>) {
    add({
      id: crypto.randomUUID(),
      name: values.name,
      email: values.email,
      phone: values.phone,
      propertyInterest: values.propertyInterest,
      message: values.message,
      submittedAt: new Date().toISOString(),
    });
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

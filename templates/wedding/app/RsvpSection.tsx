'use client';

import { useState } from 'react';
import { useLocalCollection, InquiryForm, type InquiryField } from '@portfolio/template-kit';

export interface RsvpEntry {
  id: string;
  name: string;
  attending: 'yes' | 'no';
  guestCount: number;
}

const RSVP_SEED: RsvpEntry[] = [];

const RSVP_EXTRA_FIELDS: InquiryField[] = [
  { name: 'attending', label: 'Attending? (type "yes" or "no")', type: 'text', required: true },
  { name: 'guestCount', label: 'Number of guests (including yourself)', type: 'number', required: true },
];

export function RsvpSection() {
  const { items, add, reset } = useLocalCollection<RsvpEntry>('wedding-rsvps', RSVP_SEED);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    setError(null);
    const attending: 'yes' | 'no' = values.attending?.trim().toLowerCase() === 'yes' ? 'yes' : 'no';
    const rawCount = Number(values.guestCount) || 0;
    const guestCount = attending === 'no' ? 0 : Math.max(1, rawCount);

    try {
      add({
        id: crypto.randomUUID(),
        name: values.name,
        attending,
        guestCount,
      });
    } catch (err) {
      setError('Unable to save your RSVP. Storage may be full or disabled.');
      console.error('Failed to save RSVP:', err);
      throw err;
    }
  }

  function handleReset() {
    setError(null);
    try {
      reset();
    } catch (err) {
      setError('Unable to reset RSVP data.');
      console.error('Failed to reset RSVPs:', err);
    }
  }

  const confirmedGuests = items
    .filter((entry) => entry.attending === 'yes')
    .reduce((sum, entry) => sum + entry.guestCount, 0);

  return (
    <section id="rsvp" className="wedding-rsvp" aria-label="RSVP">
      <h2>RSVP</h2>
      <p className="guest-count" aria-live="polite">
        <strong>{confirmedGuests}</strong> guests confirmed
      </p>
      {error ? (
        <p role="alert" className="guest-count">
          {error}
        </p>
      ) : null}
      <InquiryForm fields={RSVP_EXTRA_FIELDS} submitLabel="Send RSVP" onSubmit={handleSubmit} />
      <p className="guest-count">
        <button type="button" onClick={handleReset}>
          Reset demo data
        </button>
      </p>
    </section>
  );
}

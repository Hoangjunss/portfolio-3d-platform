'use client';
import { InquiryForm } from '@portfolio/template-kit/src/components/InquiryForm';
import { useLocalCollection } from '@portfolio/template-kit/src/useLocalCollection';
import type { InquiryField } from '@portfolio/template-kit/src/components/InquiryForm';

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
}

const reservationFields: InquiryField[] = [
  { name: 'partySize', label: 'Party size', type: 'number', required: true },
  { name: 'date', label: 'Date (YYYY-MM-DD)', type: 'text', required: true },
  { name: 'time', label: 'Time (HH:MM)', type: 'text', required: true },
];

export function ReservationSection() {
  const { items, add, reset } = useLocalCollection<Reservation>('restaurant-reservations', []);

  async function handleSubmit(values: Record<string, string>) {
    const partySize = Number(values.partySize);
    if (!Number.isInteger(partySize) || partySize < 1) {
      throw new Error('Party size must be a whole number of at least 1.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
      throw new Error('Date must be in YYYY-MM-DD format.');
    }
    if (!/^\d{2}:\d{2}$/.test(values.time)) {
      throw new Error('Time must be in HH:MM format.');
    }

    add({
      id: crypto.randomUUID(),
      name: values.name,
      phone: values.phone,
      partySize,
      date: values.date,
      time: values.time,
    });
  }

  return (
    <section className="restaurant-reservations">
      <h2>Reserve a table</h2>
      <InquiryForm fields={reservationFields} submitLabel="Reserve" onSubmit={handleSubmit} />

      <h3>Your reservations</h3>
      {items.length === 0 ? (
        <p>No reservations yet</p>
      ) : (
        <ul>
          {items.map((reservation) => (
            <li key={reservation.id}>
              {reservation.name} — {reservation.partySize} guests — {reservation.date} at {reservation.time}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={reset}>Reset demo data</button>
    </section>
  );
}

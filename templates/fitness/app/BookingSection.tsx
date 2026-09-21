'use client';

import { useState } from 'react';
import { useLocalCollection, SavedItemsPanel } from '@portfolio/template-kit';
import { SCHEDULE, type ScheduleEntry } from '../data/seed';

export interface Booking {
  id: string;
  className: string;
  time: string;
  bookedAt: string;
}

const BOOKINGS_SEED: Booking[] = [];

export function BookingSection() {
  const { items, add, remove, reset } = useLocalCollection<Booking>(
    'fitness-bookings',
    BOOKINGS_SEED,
  );
  const [error, setError] = useState<string | null>(null);

  function handleBook(entry: ScheduleEntry) {
    setError(null);
    const existing = items.find(
      (item) => item.className === entry.className && item.time === entry.time,
    );
    try {
      if (existing) {
        remove(existing.id);
      } else {
        add({
          id: crypto.randomUUID(),
          className: entry.className,
          time: entry.time,
          bookedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError('Unable to save your booking. Storage may be full or disabled.');
      console.error('Failed to update booking:', err);
    }
  }

  function handleRemove(id: string) {
    setError(null);
    try {
      remove(id);
    } catch (err) {
      setError('Unable to cancel booking. Storage may be full or disabled.');
      console.error('Failed to cancel booking:', err);
    }
  }

  function handleReset() {
    setError(null);
    try {
      reset();
    } catch (err) {
      setError('Unable to reset demo data.');
      console.error('Failed to reset demo data:', err);
    }
  }

  return (
    <div className="fitness-booking">
      {error ? (
        <p role="alert" className="booking-error">
          {error}
        </p>
      ) : null}
      <div className="booking-controls" aria-label="Class booking controls">
        {SCHEDULE.map((entry) => {
          const isBooked = items.some(
            (item) => item.className === entry.className && item.time === entry.time,
          );
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={isBooked}
              onClick={() => handleBook(entry)}
            >
              Book {entry.className}
            </button>
          );
        })}
      </div>
      <aside aria-label="My classes" className="my-classes-panel">
        <h3>My classes</h3>
        <SavedItemsPanel
          items={items}
          emptyLabel="No bookings yet — book a class above and it will appear here."
          onRemove={handleRemove}
          renderItem={(booking: Booking) =>
            `${booking.className} — ${booking.time} (booked ${new Date(booking.bookedAt).toLocaleString('vi-VN')})`
          }
        />
        <p>
          <button type="button" onClick={handleReset}>
            Reset demo data
          </button>
        </p>
      </aside>
    </div>
  );
}

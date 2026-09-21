'use client';

import { useState } from 'react';
import { useLocalCollection, PricedItemGrid, SavedItemsPanel } from '@portfolio/template-kit';
import type { RoomPackage, TripItem } from '../data/seed';

const MY_TRIP_SEED: TripItem[] = [];

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function TripPlannerSection({ rooms }: { rooms: RoomPackage[] }) {
  const { items, add, remove, reset } = useLocalCollection<TripItem>('travel-my-trip', MY_TRIP_SEED);
  const [error, setError] = useState<string | null>(null);

  function handleAddToTrip(room: RoomPackage) {
    setError(null);
    if (items.some((item) => item.id === room.id)) return;
    try {
      add({
        id: room.id,
        title: room.title,
        price: room.price,
        addedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError('Unable to save to your trip. Storage may be full or disabled.');
      console.error('Failed to add room to trip:', err);
    }
  }

  function handleRemove(id: string) {
    setError(null);
    try {
      remove(id);
    } catch (err) {
      setError('Unable to remove item from your trip. Storage may be full or disabled.');
      console.error('Failed to remove item from trip:', err);
    }
  }

  function handleReset() {
    setError(null);
    try {
      reset();
    } catch (err) {
      setError('Unable to reset demo data. Storage may be full or disabled.');
      console.error('Failed to reset demo data:', err);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <section id="rooms" className="bento-section">
      <h2>Rooms &amp; Packages</h2>
      {error ? <p role="alert">{error}</p> : null}
      <PricedItemGrid
        items={rooms}
        currency="VND"
        ctaLabel="Add to trip"
        onSelect={handleAddToTrip}
      />
      <aside aria-label="My trip">
        <h3>My trip</h3>
        <SavedItemsPanel
          items={items}
          emptyLabel="Your trip is empty — add a room or package above"
          onRemove={handleRemove}
          renderItem={(item: TripItem) => `${item.title} — ${formatVnd(item.price)}`}
        />
        <p className="trip-subtotal">
          Subtotal: <strong>{formatVnd(subtotal)}</strong>
        </p>
        <button type="button" onClick={handleReset}>
          Reset demo data
        </button>
      </aside>
    </section>
  );
}

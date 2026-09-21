'use client';
import { useLocalCollection } from '@portfolio/template-kit/src/useLocalCollection';
import { SavedItemsPanel } from '@portfolio/template-kit/src/components/SavedItemsPanel';
import { LISTINGS } from '../data/seed';

export interface SavedListing {
  id: string;
  title: string;
  savedAt: string;
}

const SAVED_SEED: SavedListing[] = [];

export function SaveListingsSection() {
  const { items, add, remove, reset } = useLocalCollection<SavedListing>(
    'realestate-saved',
    SAVED_SEED,
  );

  function isSaved(listingId: string) {
    return items.some((saved) => saved.id === listingId);
  }

  function toggle(listingId: string, address: string) {
    if (isSaved(listingId)) {
      remove(listingId);
    } else {
      add({ id: listingId, title: address, savedAt: new Date().toISOString() });
    }
  }

  return (
    <section className="realestate-save-listings">
      <div className="realestate-save-toggle-overlay" aria-label="Save a listing">
        {LISTINGS.map((listing) => {
          const saved = isSaved(listing.id);
          return (
            <button
              key={listing.id}
              type="button"
              aria-pressed={saved}
              onClick={() => toggle(listing.id, listing.address)}
            >
              {saved ? `Saved ${listing.address}` : `Save ${listing.address}`}
            </button>
          );
        })}
      </div>
      <aside aria-label="Saved listings">
        <h3>Saved listings</h3>
        <SavedItemsPanel
          items={items}
          emptyLabel="No saved listings yet — tap Save on a listing to add it here"
          onRemove={remove}
          renderItem={(saved: SavedListing) => saved.title}
        />
        <button type="button" onClick={reset}>Reset demo data</button>
      </aside>
    </section>
  );
}

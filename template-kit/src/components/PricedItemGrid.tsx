'use client';

export interface PricedItem {
  id: string;
  title: string;
  price: number;
  image?: string;
}

export interface PricedItemGridProps {
  items: PricedItem[];
  currency: string;
  ctaLabel?: string;
  onSelect?: (item: PricedItem) => void;
  selectedItemId?: string;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
}

export function PricedItemGrid({ items, currency, ctaLabel, onSelect, selectedItemId }: PricedItemGridProps) {
  return (
    <ul className="tk-priced-item-grid">
      {items.map((item) => {
        const isSelected = item.id === selectedItemId;
        return (
          <li key={item.id} data-selected={isSelected || undefined}>
            {item.image ? <img src={item.image} alt="" /> : null}
            {isSelected ? <span className="tk-priced-item-grid-status">Your plan</span> : null}
            <h3>{item.title}</h3>
            <span>{formatPrice(item.price, currency)}</span>
            {ctaLabel ? (
              <button type="button" onClick={() => onSelect?.(item)}>{ctaLabel}</button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

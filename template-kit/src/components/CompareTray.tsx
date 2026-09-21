'use client';

export interface CompareTrayProps<T extends { id: string }> {
  items: T[];
  onRemove: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}

export function CompareTray<T extends { id: string }>({ items, onRemove, renderItem }: CompareTrayProps<T>) {
  return (
    <div className="tk-compare-tray" data-count={items.length}>
      {items.map((item) => (
        <div key={item.id} className="tk-compare-column">
          <span>{renderItem(item)}</span>
          <button type="button" onClick={() => onRemove(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

'use client';

export interface SavedItemsPanelProps<T extends { id: string }> {
  items: T[];
  emptyLabel: string;
  onRemove: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}

export function SavedItemsPanel<T extends { id: string }>({ items, emptyLabel, onRemove, renderItem }: SavedItemsPanelProps<T>) {
  if (items.length === 0) {
    return <p className="tk-saved-items-empty">{emptyLabel}</p>;
  }
  return (
    <ul className="tk-saved-items-panel">
      {items.map((item) => (
        <li key={item.id}>
          <span>{renderItem(item)}</span>
          <button type="button" onClick={() => onRemove(item.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}

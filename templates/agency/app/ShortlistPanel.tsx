import { SavedItemsPanel } from '@portfolio/template-kit';

export interface ShortlistEntry {
  id: string;
  title: string;
  savedAt: string;
}

export interface ShortlistPanelProps {
  items: ShortlistEntry[];
  onRemove: (id: string) => void;
}

export function ShortlistPanel({ items, onRemove }: ShortlistPanelProps) {
  return (
    <aside className="agency-shortlist" aria-label="Saved projects">
      <SavedItemsPanel
        items={items}
        emptyLabel="Nothing saved yet — tap Save on a project you like"
        onRemove={onRemove}
        renderItem={(saved) => saved.title}
      />
    </aside>
  );
}

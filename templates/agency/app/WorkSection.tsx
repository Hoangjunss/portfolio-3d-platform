'use client';

import { useState } from 'react';
import { ItemGrid, useLocalCollection } from '@portfolio/template-kit';
import { WORK_CATEGORIES, type WorkItem } from '../data/work';
import { ShortlistPanel, type ShortlistEntry } from './ShortlistPanel';

export interface WorkSectionProps {
  items: WorkItem[];
}

export function WorkSection({ items }: WorkSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | WorkItem['category']>('all');
  const { items: shortlist, add, remove } = useLocalCollection<ShortlistEntry>('agency-shortlist', []);
  const visible = items.filter((item) => activeCategory === 'all' || item.category === activeCategory);

  function toggleSave(item: WorkItem) {
    if (shortlist.some((saved) => saved.id === item.id)) {
      remove(item.id);
      return;
    }
    add({ id: item.id, title: item.title, savedAt: new Date().toISOString() });
  }

  return (
    <section id="work" className="agency-work-section" aria-labelledby="work-heading">
      <div className="agency-section-heading">
        <h2 id="work-heading">Ideas made useful.</h2>
      </div>
      <div className="agency-filter-tabs" role="group" aria-label="Filter work by category">
        <button type="button" aria-pressed={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</button>
        {WORK_CATEGORIES.map((category) => (
          <button key={category.key} type="button" aria-pressed={activeCategory === category.key} onClick={() => setActiveCategory(category.key)}>{category.label}</button>
        ))}
      </div>
      <div className="agency-work-grid-with-actions">
        <ItemGrid items={visible.map(({ id, title, description, image }) => ({ id, title, description, image }))} columns={3} />
        <ul className="agency-save-buttons" aria-label="Save projects">
          {visible.map((item) => {
            const saved = shortlist.some((entry) => entry.id === item.id);
            const label = saved ? `Remove ${item.title} from shortlist` : `Save ${item.title}`;
            return <li key={item.id}><button type="button" aria-label={label} onClick={() => toggleSave(item)}>{saved ? 'Saved' : 'Save'}</button></li>;
          })}
        </ul>
      </div>
      <ShortlistPanel items={shortlist} onRemove={remove} />
    </section>
  );
}

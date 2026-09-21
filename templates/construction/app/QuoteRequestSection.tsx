'use client';

import { useState } from 'react';
import { useLocalCollection, SavedItemsPanel } from '@portfolio/template-kit';
import type { ConstructionProject } from '../data/seed';

export interface QuoteItem {
  id: string;
  projectRef: string;
  title: string;
  category: string;
  requestedAt: string;
}

const QUOTE_SEED: QuoteItem[] = [];

export interface QuoteRequestSectionProps {
  projects: ConstructionProject[];
}

export function QuoteRequestSection({ projects }: QuoteRequestSectionProps) {
  const { items, add, remove, reset } = useLocalCollection<QuoteItem>(
    'construction-quote-requests',
    QUOTE_SEED,
  );
  const [error, setError] = useState<string | null>(null);

  function handleRequestQuote(project: ConstructionProject) {
    setError(null);
    if (items.some((item) => item.id === project.id)) return;
    try {
      add({
        id: project.id,
        projectRef: project.id,
        title: project.title,
        category: project.category,
        requestedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError('Unable to save your request. Storage may be full or disabled.');
      console.error('Failed to request quote:', err);
    }
  }

  function handleRemove(id: string) {
    setError(null);
    try {
      remove(id);
    } catch (err) {
      setError('Unable to remove item from your requests. Storage may be full or disabled.');
      console.error('Failed to remove request:', err);
    }
  }

  function handleReset() {
    setError(null);
    try {
      reset();
    } catch (err) {
      setError('Unable to reset demo data. Storage may be full or disabled.');
      console.error('Failed to reset requests:', err);
    }
  }

  return (
    <section id="quote" className="split" data-flip="true">
      <div className="split-text">
        <span className="split-label">BÁO GIÁ / QUOTE</span>
        <h2>Request a Quote</h2>
        <p>
          Select any project from our portfolio to request an architectural consultation or
          preliminary construction estimate.
        </p>
        {error ? <p role="alert">{error}</p> : null}
        <aside aria-label="Your requests">
          <h3>Your requests</h3>
          <SavedItemsPanel
            items={items}
            emptyLabel="No requests yet — select a project above to request a quote."
            onRemove={handleRemove}
            renderItem={(item) => `${item.title} — ${item.category}`}
          />
          <div className="quote-controls">
            <button type="button" onClick={handleReset}>
              Reset demo data
            </button>
          </div>
        </aside>
      </div>
      <div className="split-proof">
        <ul className="quote-projects">
          {projects.map((project) => {
            const isRequested = items.some((item) => item.id === project.id);
            return (
              <li key={project.id}>
                <h3>{project.title}</h3>
                <p>{project.category} · {project.location}</p>
                <div className="quote-controls">
                  <button
                    type="button"
                    aria-pressed={isRequested}
                    onClick={() => handleRequestQuote(project)}
                  >
                    Request a quote
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

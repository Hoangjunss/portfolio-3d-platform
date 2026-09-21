'use client';

import { useState } from 'react';
import { useLocalCollection, SavedItemsPanel } from '@portfolio/template-kit';
import type { TimelineEntry } from '@portfolio/template-kit';

export interface ScheduleEntry {
  id: string;
  title: string;
  addedAt: string;
}

const SCHEDULE_SEED: ScheduleEntry[] = [];

export interface ScheduleSectionProps {
  agenda: TimelineEntry[];
}

export function ScheduleSection({ agenda }: ScheduleSectionProps) {
  const { items, add, remove, reset } = useLocalCollection<ScheduleEntry>(
    'event-my-schedule',
    SCHEDULE_SEED,
  );
  const [error, setError] = useState<string | null>(null);

  function handleAdd(entry: TimelineEntry) {
    setError(null);
    if (items.some((scheduled) => scheduled.id === entry.id)) {
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        const probeKey = '__storage_probe__';
        window.localStorage.setItem(probeKey, '1');
        window.localStorage.removeItem(probeKey);
      }
      add({
        id: entry.id,
        title: entry.title,
        addedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError('Unable to update schedule. Storage may be full or disabled.');
      console.error('Failed to add session to schedule:', err);
    }
  }

  function handleRemove(id: string) {
    setError(null);
    try {
      if (typeof window !== 'undefined') {
        const probeKey = '__storage_probe__';
        window.localStorage.setItem(probeKey, '1');
        window.localStorage.removeItem(probeKey);
      }
      remove(id);
    } catch (err) {
      setError('Unable to remove session from schedule.');
      console.error('Failed to remove session from schedule:', err);
    }
  }

  function handleReset() {
    setError(null);
    try {
      if (typeof window !== 'undefined') {
        const probeKey = '__storage_probe__';
        window.localStorage.setItem(probeKey, '1');
        window.localStorage.removeItem(probeKey);
      }
      reset();
    } catch (err) {
      setError('Unable to reset schedule.');
      console.error('Failed to reset schedule:', err);
    }
  }

  return (
    <section id="schedule" className="event-schedule" aria-label="Schedule builder">
      <h2>My schedule</h2>
      {error ? (
        <p role="alert" className="tk-saved-items-empty">
          {error}
        </p>
      ) : null}
      <div aria-label="My schedule">
        <SavedItemsPanel
          items={items}
          emptyLabel="Your schedule is empty — add sessions from the agenda below."
          onRemove={handleRemove}
          renderItem={(entry) => (
            <>
              <strong>{entry.title}</strong>{' '}
              <time dateTime={entry.addedAt}>
                {new Date(entry.addedAt).toLocaleTimeString('vi-VN')}
              </time>
            </>
          )}
        />
      </div>
      <button
        type="button"
        className="schedule-reset"
        onClick={handleReset}
      >
        Reset demo schedule
      </button>
      <div className="agenda-controls" aria-label="Add sessions to your schedule">
        {agenda.map((entry) => {
          const isAdded = items.some((scheduled) => scheduled.id === entry.id);
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={isAdded}
              onClick={() => handleAdd(entry)}
            >
              {isAdded ? `Added: ${entry.title}` : `Add ${entry.title} to my schedule`}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface TimelineProps {
  entries: TimelineEntry[];
  orientation: 'vertical' | 'horizontal';
}

export function Timeline({ entries, orientation }: TimelineProps) {
  return (
    <ol className="tk-timeline" data-orientation={orientation}>
      {entries.map((entry) => (
        <li key={entry.id}>
          {entry.date ? <time>{entry.date}</time> : null}
          <h3>{entry.title}</h3>
          <p>{entry.description}</p>
        </li>
      ))}
    </ol>
  );
}

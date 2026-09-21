export interface Stat {
  label: string;
  value: string;
}

export interface StatBlockProps {
  stats: Stat[];
}

export function StatBlock({ stats }: StatBlockProps) {
  if (stats.length === 0) return null;
  return (
    <dl className="tk-stat-block">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

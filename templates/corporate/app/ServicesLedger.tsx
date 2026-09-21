import type { ServiceItem } from '../data/seed';

export interface ServicesLedgerProps {
  eyebrow: string;
  lead: ServiceItem;
  rest: ServiceItem[];
}

export function ServicesLedger({ eyebrow, lead, rest }: ServicesLedgerProps) {
  return (
    <section className="corporate-services" id="services">
      <p className="corporate-services-eyebrow">{eyebrow}</p>
      <div className="corporate-services-lead">
        <span aria-hidden="true">01</span>
        <div>
          <h3>{lead.title}</h3>
          <p>{lead.description}</p>
        </div>
      </div>
      <ul className="corporate-services-grid">
        {rest.map((item, index) => (
          <li key={item.id}>
            <span aria-hidden="true">{String(index + 2).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

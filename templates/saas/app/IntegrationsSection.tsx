import { INTEGRATIONS } from '../data/seed';

export function IntegrationsSection() {
  return (
    <section className="saas-section saas-integrations" aria-labelledby="integrations-heading">
      <div className="saas-heading">
        <h2 id="integrations-heading">Works with the tools you already use.</h2>
      </div>
      <ul className="saas-integration-strip">
        {INTEGRATIONS.map((item) => (
          <li key={item.id}>
            <span className="saas-integration-mark" aria-hidden="true">{item.title.charAt(0)}</span>
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

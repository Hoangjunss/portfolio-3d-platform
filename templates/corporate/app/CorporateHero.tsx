export interface CorporateHeroProps {
  eyebrow: string;
  headline: string;
  subhead: string;
  ctaLabel: string;
  ctaHref: string;
  credentials: string;
}

export function CorporateHero({
  eyebrow,
  headline,
  subhead,
  ctaLabel,
  ctaHref,
  credentials,
}: CorporateHeroProps) {
  return (
    <section className="corporate-hero" id="top">
      <div className="corporate-hero-main">
        <p className="corporate-hero-eyebrow">{eyebrow}</p>
        <h1>{headline}</h1>
        <p className="corporate-hero-sub">{subhead}</p>
        <a className="corporate-hero-cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
      <div className="corporate-hero-mark" aria-hidden="true">
        <div className="corporate-hero-mark-rings" />
        <p className="corporate-hero-credentials">{credentials}</p>
      </div>
    </section>
  );
}

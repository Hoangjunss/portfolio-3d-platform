export interface HeroProps {
  headline: string;
  subhead: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImage?: string;
}

export function Hero({ headline, subhead, ctaLabel, ctaHref, backgroundImage }: HeroProps) {
  return (
    <section
      className="tk-hero"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      <h1>{headline}</h1>
      <p>{subhead}</p>
      <a href={ctaHref}>{ctaLabel}</a>
    </section>
  );
}

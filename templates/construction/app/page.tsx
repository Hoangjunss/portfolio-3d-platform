import {
  Hero,
  PhotoGallery,
  Timeline,
  ItemGrid,
  Footer,
  type FooterLink,
} from '@portfolio/template-kit';
import {
  PROJECTS,
  PROCESS_STEPS,
  SERVICES,
} from '../data/seed';
import { QuoteRequestSection } from './QuoteRequestSection';

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Projects', href: '#projects' },
  { label: 'Request a Quote', href: '#quote' },
  { label: 'Process', href: '#process' },
  { label: 'Services', href: '#services' },
];

export default function ConstructionPage() {
  const galleryPhotos = PROJECTS.map((project) => ({
    id: project.id,
    src: project.photo.src,
    alt: project.photo.alt,
  }));

  return (
    <main>
      <Hero
        headline="Thiên Trường Construction & Architecture"
        subhead="Residential, commercial, and renovation construction with in-house architectural design."
        ctaLabel="See our work"
        ctaHref="#projects"
      />

      <section id="projects" className="split">
        <div className="split-text">
          <span className="split-label">DỰ ÁN / PORTFOLIO</span>
          <h2>Selected Works</h2>
          <p>
            A curated portfolio spanning low-rise villas, logistics hubs, community architecture,
            and sensitive historical shophouse retrofits.
          </p>
        </div>
        <div className="split-proof">
          <PhotoGallery
            photos={galleryPhotos}
            layout="masonry"
            lightbox={true}
          />
        </div>
      </section>

      <QuoteRequestSection projects={PROJECTS} />

      <section id="process" className="split" data-flip="true">
        <div className="split-text">
          <span className="split-label">QUY TRÌNH / PROCESS</span>
          <h2>Build Process</h2>
          <p>
            From on-site geotechnical assessment and permit clearance through to phased
            construction and certified 24-month structural warranty handover.
          </p>
        </div>
        <div className="split-proof">
          <Timeline
            entries={PROCESS_STEPS}
            orientation="horizontal"
          />
        </div>
      </section>

      <section id="services" className="split">
        <div className="split-text">
          <span className="split-label">DỊCH VỤ / SERVICES</span>
          <h2>Our Services</h2>
          <p>
            Disciplined execution across residential construction, commercial facilities,
            architectural concept coordination, and structural renovations.
          </p>
        </div>
        <div className="split-proof">
          <ItemGrid
            items={SERVICES}
            columns={3}
          />
        </div>
      </section>

      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

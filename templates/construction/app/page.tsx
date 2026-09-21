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

      {/* Quote request slot — wired in Task 3 */}
      <section id="quote" className="split" data-flip="true">
        <div className="split-text">
          <span className="split-label">BÁO GIÁ / QUOTE</span>
          <h2>Request a Quote</h2>
          <p>
            Select any project from our portfolio to request an architectural consultation or
            preliminary construction estimate.
          </p>
        </div>
        <div className="split-proof">
          <p className="tk-saved-items-empty">Select a project above to request a quote.</p>
        </div>
      </section>

      <section id="process" className="split">
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

      <section id="services" className="split" data-flip="true">
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

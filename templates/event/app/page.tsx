import { Hero, Timeline, PeopleGrid, PricedItemGrid, Footer } from '@portfolio/template-kit';
import { AGENDA, SPEAKERS, TICKETS } from '../data/seed';

// Only sections this page actually renders. Avoid dead anchors (#about, #contact).
const FOOTER_LINKS = [
  { label: 'Lịch trình', href: '#agenda' },
  { label: 'Diễn giả', href: '#speakers' },
  { label: 'Vé tham dự', href: '#tickets' },
];

export default function EventPage() {
  return (
    <main>
      <Hero
        headline="Đồng Vọng Tech Summit"
        subhead="A one-day conference for engineers building at the edge of AI, robotics, climate tech, and creative technology."
        ctaLabel="Đăng ký vé"
        ctaHref="#tickets"
      />
      {/* Interactive section slot: Task 3 wires ScheduleSection client component here */}
      <section id="agenda" aria-label="Chương trình hội nghị">
        <Timeline entries={AGENDA} orientation="horizontal" />
      </section>
      <section id="speakers" aria-label="Diễn giả">
        <PeopleGrid people={SPEAKERS} roleLabel="Speakers" />
      </section>
      <section id="tickets" aria-label="Vé tham dự">
        <PricedItemGrid items={TICKETS} currency="VND" ctaLabel="Chọn vé" />
      </section>
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

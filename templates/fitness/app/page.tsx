import {
  Hero,
  RecordTable,
  PeopleGrid,
  PricedItemGrid,
  Footer,
  type RecordTableColumn,
  type FooterLink,
} from '@portfolio/template-kit';
import { SCHEDULE, TRAINERS, MEMBERSHIP_TIERS } from '../data/seed';

const SCHEDULE_COLUMNS: RecordTableColumn[] = [
  { key: 'className', label: 'Class' },
  { key: 'time', label: 'Day / Time' },
  { key: 'trainer', label: 'Trainer' },
];

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Schedule', href: '#schedule' },
  { label: 'Trainers', href: '#trainers' },
  { label: 'Membership', href: '#membership' },
];

export default function FitnessPage() {
  return (
    <main>
      <Hero
        headline="Iron Line Fitness"
        subhead="Class schedule, trainers, and membership plans for a boutique strength & conditioning gym."
        ctaLabel="View schedule"
        ctaHref="#schedule"
      />
      <section id="schedule" className="stage" aria-label="Class schedule">
        <span className="stage-number">01</span>
        <h2>Class Schedule</h2>
        <RecordTable columns={SCHEDULE_COLUMNS} rows={SCHEDULE} />
        {/* Booking client component slot - wired in Task 3 */}
      </section>
      <section id="trainers" className="stage" aria-label="Trainers">
        <span className="stage-number">02</span>
        <h2>Trainers</h2>
        <PeopleGrid people={TRAINERS} roleLabel="Trainers" />
      </section>
      <section id="membership" className="stage" aria-label="Membership tiers">
        <span className="stage-number">03</span>
        <h2>Membership Tiers</h2>
        <PricedItemGrid items={MEMBERSHIP_TIERS} currency="VND" ctaLabel="Join" />
      </section>
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

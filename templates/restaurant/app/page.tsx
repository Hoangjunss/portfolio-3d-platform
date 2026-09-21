import { Hero } from '@portfolio/template-kit/src/components/Hero';
import { PricedItemGrid } from '@portfolio/template-kit/src/components/PricedItemGrid';
import { Footer } from '@portfolio/template-kit/src/components/Footer';
import { restaurant, menu, CATEGORIES } from '../data/seed';
import { ReservationSection } from './ReservationSection';

const FOOTER_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'Reservations', href: '#reservations' },
  { label: 'Hours & Location', href: '#about' },
];

export default function RestaurantPage() {
  return (
    <main>
      <Hero
        headline={restaurant.name}
        subhead={restaurant.tagline}
        ctaLabel="Reserve a table"
        ctaHref="#reservations"
      />

      <div id="menu">
        {CATEGORIES.map((category) => {
          const categoryItems = menu.filter((item) => item.category === category);
          return (
            <section key={category} className="menu-section" aria-label={`${category} menu`}>
              <h2>{category}</h2>
              <PricedItemGrid items={categoryItems} currency="VND" />
            </section>
          );
        })}
      </div>

      <div id="reservations">
        <ReservationSection />
      </div>

      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}

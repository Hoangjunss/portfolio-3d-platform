export interface WorkCategory {
  key: 'branding' | 'web-design' | 'product' | 'motion' | 'strategy';
  label: string;
}

export const WORK_CATEGORIES: WorkCategory[] = [
  { key: 'branding', label: 'Branding' },
  { key: 'web-design', label: 'Web Design' },
  { key: 'product', label: 'Product' },
  { key: 'motion', label: 'Motion' },
  { key: 'strategy', label: 'Strategy' },
];

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  category: WorkCategory['key'];
  image: string;
}

export const WORK_ITEMS: WorkItem[] = [
  { id: 'harborline-rebrand', title: 'Harborline Rebrand', description: 'Full identity system for a Pacific Northwest ferry operator, from wordmark to wayfinding signage.', category: 'branding', image: '/work/harborline-rebrand.webp' },
  { id: 'nimbus-app-redesign', title: 'Nimbus Weather App Redesign', description: 'UX overhaul and design system for a weather app with a clearer onboarding journey.', category: 'product', image: '/work/nimbus-app-redesign.webp' },
  { id: 'cascade-coffee-site', title: 'Cascade Coffee Roasters Site', description: 'E-commerce storefront and subscription flow for a specialty coffee roaster.', category: 'web-design', image: '/work/cascade-coffee-site.webp' },
  { id: 'lumen-launch-film', title: 'Lumen Health Launch Film', description: "A 60-second brand film for a telehealth startup's Series A launch.", category: 'motion', image: '/work/lumen-launch-film.webp' },
  { id: 'greenline-transit-strategy', title: 'Greenline Transit Brand Strategy', description: "Positioning and naming for a regional transit authority's new express line.", category: 'strategy', image: '/work/greenline-transit-strategy.webp' },
  { id: 'fieldnote-packaging', title: 'Fieldnote Journal Packaging', description: "Packaging and retail display system for a stationery brand's flagship notebook line.", category: 'branding', image: '/work/fieldnote-packaging.webp' },
  { id: 'orbit-fitness-platform', title: 'Orbit Fitness Platform', description: 'Cross-platform design system for a boutique fitness studio booking app.', category: 'product', image: '/work/orbit-fitness-platform.webp' },
];

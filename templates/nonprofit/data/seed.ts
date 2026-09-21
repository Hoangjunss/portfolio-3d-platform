import type { GridItem, Stat } from '@portfolio/template-kit';

export interface CauseItem extends GridItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const CAUSES: CauseItem[] = [
  {
    id: 'cause-education',
    title: 'School Scholarships',
    description: 'Tuition and school-supply support for children from low-income households in rural provinces.',
    icon: 'graduation-cap',
  },
  {
    id: 'cause-nutrition',
    title: 'Child Nutrition Program',
    description: 'Daily meal support and nutrition monitoring for children under 6 in underserved communes.',
    icon: 'heart',
  },
  {
    id: 'cause-shelter',
    title: 'Emergency Shelter Repair',
    description: 'Rapid home-repair grants for families affected by seasonal flooding.',
    icon: 'home',
  },
  {
    id: 'cause-healthcare',
    title: 'Mobile Health Clinics',
    description: 'Free basic health checkups and medicine for elderly residents in remote villages.',
    icon: 'stethoscope',
  },
  {
    id: 'cause-clean-water',
    title: 'Clean Water Access',
    description: 'Well and filtration-system installation for communes without reliable clean water.',
    icon: 'droplet',
  },
];

export const IMPACT_STATS: Stat[] = [
  { label: 'Children supported (example)', value: '1,240+' },
  { label: 'Communes reached (example)', value: '38' },
  { label: 'Meals provided this year (example)', value: '86,000+' },
  { label: 'Volunteer hours logged (example)', value: '5,300+' },
];

export interface Pledge {
  id: string;
  name: string;
  amountVnd: number;
  pledgedAt: string;
}

export const PLEDGE_SEED: Pledge[] = [
  { id: 'seed-pledge-1', name: 'Trần Thị Mai (example donor)', amountVnd: 500000, pledgedAt: '2026-08-01T09:00:00.000Z' },
  { id: 'seed-pledge-2', name: 'Nguyễn Văn Phúc (example donor)', amountVnd: 1200000, pledgedAt: '2026-08-14T14:30:00.000Z' },
  { id: 'seed-pledge-3', name: 'Lê Thị Hạnh (example donor)', amountVnd: 300000, pledgedAt: '2026-08-27T11:15:00.000Z' },
];

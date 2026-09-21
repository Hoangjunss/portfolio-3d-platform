export interface ScheduleEntry {
  id: string;
  className: string;
  time: string;
  trainer: string;
}

export interface Trainer {
  id: string;
  name: string;
  role: string;
}

export interface MembershipTier {
  id: string;
  title: string;
  price: number;
  description: string;
}

export const SCHEDULE: ScheduleEntry[] = [
  { id: 'hiit-mon', className: 'Sunrise HIIT', time: 'Mon 06:00–06:45', trainer: 'Minh Quân' },
  { id: 'yoga-mon', className: 'Power Vinyasa Yoga', time: 'Mon 18:00–19:00', trainer: 'Thảo Chi' },
  { id: 'strength-tue', className: 'Strength Foundations', time: 'Tue 07:00–08:00', trainer: 'Đức Anh' },
  { id: 'spin-tue', className: 'Spin & Burn', time: 'Tue 17:30–18:15', trainer: 'Ngọc Hà' },
  { id: 'boxing-wed', className: 'Boxing Conditioning', time: 'Wed 06:30–07:30', trainer: 'Minh Quân' },
  { id: 'mobility-wed', className: 'Mobility & Recovery', time: 'Wed 12:00–12:45', trainer: 'Thảo Chi' },
  { id: 'lifting-thu', className: 'Olympic Lifting Clinic', time: 'Thu 18:30–19:45', trainer: 'Đức Anh' },
  { id: 'core-fri', className: 'Core & Glutes Sculpt', time: 'Fri 06:00–06:45', trainer: 'Ngọc Hà' },
  { id: 'bootcamp-sat', className: 'Saturday Bootcamp', time: 'Sat 08:00–09:00', trainer: 'Minh Quân' },
  { id: 'yoga-sat', className: 'Restorative Yoga', time: 'Sat 10:00–10:45', trainer: 'Thảo Chi' },
  { id: 'functional-sun', className: 'Functional Circuit', time: 'Sun 09:00–09:45', trainer: 'Đức Anh' },
  { id: 'youth-sun', className: 'Youth Athletics', time: 'Sun 11:00–11:45', trainer: 'Ngọc Hà' },
];

export const TRAINERS: Trainer[] = [
  { id: 'trainer-minh-quan', name: 'Minh Quân', role: 'Strength & Conditioning Coach' },
  { id: 'trainer-thao-chi', name: 'Thảo Chi', role: 'Yoga & Mobility Instructor' },
  { id: 'trainer-duc-anh', name: 'Đức Anh', role: 'Olympic Weightlifting Coach' },
  { id: 'trainer-ngoc-ha', name: 'Ngọc Hà', role: 'Group Fitness & Spin Instructor' },
];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'tier-basic',
    title: 'Basic',
    price: 590000,
    description: 'Gym floor access, 2 group classes/month',
  },
  {
    id: 'tier-standard',
    title: 'Standard',
    price: 990000,
    description: 'Unlimited group classes, gym floor access, 1 PT session/month',
  },
  {
    id: 'tier-premium',
    title: 'Premium',
    price: 1690000,
    description: 'Unlimited group classes + gym floor, 4 PT sessions/month, sauna/recovery room access',
  },
];

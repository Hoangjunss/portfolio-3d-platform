import type { PricedItem, GridItem, InquiryField } from '@portfolio/template-kit';

export interface RoomPackage extends PricedItem {
  id: string;
  title: string;
  price: number;
  image?: string;
}

export const ROOMS: RoomPackage[] = [
  {
    id: 'room-garden',
    title: 'Garden View Room (per night)',
    price: 1850000,
  },
  {
    id: 'room-ocean-deluxe',
    title: 'Ocean View Deluxe (per night)',
    price: 2950000,
  },
  {
    id: 'room-family-suite',
    title: 'Family Suite (per night)',
    price: 4200000,
  },
  {
    id: 'room-honeymoon-villa',
    title: 'Honeymoon Pool Villa (per night)',
    price: 6800000,
  },
  {
    id: 'pkg-weekend-getaway',
    title: 'Weekend Getaway Package — 2 nights, breakfast + spa voucher',
    price: 5400000,
  },
  {
    id: 'pkg-beach-escape',
    title: '3-Night Beach Escape Package — all-day dining included',
    price: 9900000,
  },
  {
    id: 'pkg-business-retreat',
    title: 'Business Retreat Package — 2 nights, private meeting room',
    price: 7200000,
  },
  {
    id: 'pkg-family-fun',
    title: 'Family Fun Package — 4 nights, kids club included',
    price: 15600000,
  },
];

export interface AmenityItem extends GridItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const AMENITIES: AmenityItem[] = [
  { id: 'amenity-pool', title: 'Infinity Pool', description: 'Overlooking the bay, open sunrise to sunset.', icon: 'waves' },
  { id: 'amenity-beach', title: 'Private Beach Access', description: "Direct resort access to Vịnh Ngọc Bay's white-sand shoreline.", icon: 'umbrella' },
  { id: 'amenity-spa', title: 'Full-Service Spa & Wellness', description: 'Traditional and modern treatments, open daily.', icon: 'flower' },
  { id: 'amenity-dive', title: 'Dive & Snorkeling Center', description: 'Guided reef trips and equipment rental on-site.', icon: 'anchor' },
  { id: 'amenity-kids', title: 'Kids Club & Family Pool', description: 'Supervised activities for ages 4-12.', icon: 'users' },
  { id: 'amenity-fitness', title: '24/7 Fitness Center', description: 'Full equipment, ocean-facing studio.', icon: 'dumbbell' },
  { id: 'amenity-dining', title: 'Three On-Site Restaurants', description: 'Vietnamese, seafood, and international menus.', icon: 'utensils' },
  { id: 'amenity-shuttle', title: 'Airport Shuttle Service', description: 'Scheduled transfers, booked at check-in.', icon: 'car' },
  { id: 'amenity-bikes', title: 'Free Bicycle Rental', description: 'Explore the coastal town at your own pace.', icon: 'bike' },
  { id: 'amenity-bar', title: 'Rooftop Sunset Bar', description: 'Open-air bar with bay views, evenings only.', icon: 'martini' },
];

export const MAP_PLACEHOLDER_CAPTION = 'Resort location — Vịnh Ngọc Bay, Khánh Hòa';

export const BOOKING_INQUIRY_FIELDS: InquiryField[] = [
  { name: 'checkInDate', label: 'Check-in date', type: 'text', required: true },
  { name: 'guestCount', label: 'Number of guests', type: 'number', required: true },
];

export interface TripItem {
  id: string;
  title: string;
  price: number;
  addedAt: string;
}

export const MY_TRIP_SEED: TripItem[] = [];

export interface WeddingDetails {
  partnerOneName: string;
  partnerTwoName: string;
  weddingDateIso: string;
  venueName: string;
  venueAddress: string;
}

export const WEDDING: WeddingDetails = {
  partnerOneName: 'Nguyễn Hoàng Minh',
  partnerTwoName: 'Đặng Thanh Hà',
  weddingDateIso: '2026-12-20T17:00:00+07:00',
  venueName: 'Ngọc Lan Garden Hall',
  venueAddress: '58 Đường Nguyễn Văn Hưởng, TP. Thủ Đức, TP.HCM',
};

export interface Photo {
  id: string;
  src: string;
  alt: string;
}

export const PHOTOS: Photo[] = [
  { id: 'photo-1', src: '/gallery/engagement-01.webp', alt: 'Minh and Hà laughing together at their engagement shoot in a Đà Lạt pine forest' },
  { id: 'photo-2', src: '/gallery/engagement-02.webp', alt: 'Close-up portrait of Hà in her engagement áo dài, golden-hour light' },
  { id: 'photo-3', src: '/gallery/engagement-03.webp', alt: 'Minh and Hà holding hands walking along a lakeside path' },
  { id: 'photo-4', src: '/gallery/couple-01.webp', alt: 'Minh and Hà seated together at a café table, candid moment' },
  { id: 'photo-5', src: '/gallery/couple-02.webp', alt: 'Minh and Hà dancing during a rehearsal at Ngọc Lan Garden Hall' },
  { id: 'photo-6', src: '/gallery/family-01.webp', alt: 'Minh and Hà with both families at an engagement gathering' },
  { id: 'photo-7', src: '/gallery/venue-01.webp', alt: 'Ngọc Lan Garden Hall decorated for the reception, string lights over the garden' },
  { id: 'photo-8', src: '/gallery/couple-03.webp', alt: 'Minh and Hà embracing at sunset near the venue garden' },
];

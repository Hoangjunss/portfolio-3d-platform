import type { GridItem } from '@portfolio/template-kit/src/components/ItemGrid';
import type { InquiryField } from '@portfolio/template-kit/src/components/InquiryForm';

export interface PropertyListing {
  id: string;
  address: string;
  priceVnd: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  propertyType: 'apartment' | 'townhouse' | 'villa' | 'land';
  mapPlaceholderNote: string;
  mapPlaceholderImage: string;
}

export const LISTINGS: PropertyListing[] = [
  {
    id: 'listing-1',
    address: '12 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    priceVnd: 8500000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 110,
    propertyType: 'apartment',
    mapPlaceholderNote: 'Static map placeholder — Quận 1 riverside district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-01.webp',
  },
  {
    id: 'listing-2',
    address: '45 Đường Trần Não, Phường An Khánh, TP. Thủ Đức, TP.HCM',
    priceVnd: 5200000000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 78,
    propertyType: 'apartment',
    mapPlaceholderNote: 'Static map placeholder — Thủ Đức riverside pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-02.webp',
  },
  {
    id: 'listing-3',
    address: '8 Ngõ 12 Đường Nguyễn Đình Chiểu, Phường Đống Đa, Hà Nội',
    priceVnd: 6800000000,
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 95,
    propertyType: 'townhouse',
    mapPlaceholderNote: 'Static map placeholder — Đống Đa inner-city pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-03.webp',
  },
  {
    id: 'listing-4',
    address: '21 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
    priceVnd: 3950000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 120,
    propertyType: 'townhouse',
    mapPlaceholderNote: 'Static map placeholder — Thủ Đức eastern-district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-04.webp',
  },
  {
    id: 'listing-5',
    address: '3 Đường Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
    priceVnd: 32000000000,
    bedrooms: 5,
    bathrooms: 5,
    areaSqm: 380,
    propertyType: 'villa',
    mapPlaceholderNote: 'Static map placeholder — Thảo Điền villa-compound pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-05.webp',
  },
  {
    id: 'listing-6',
    address: '67 Đường Hoàng Hoa Thám, Phường Vĩnh Trung, Đà Nẵng',
    priceVnd: 4400000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 88,
    propertyType: 'apartment',
    mapPlaceholderNote: 'Static map placeholder — Đà Nẵng coastal-district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-06.webp',
  },
  {
    id: 'listing-7',
    address: 'Lô B14 Khu dân cư Him Lam, Phường Tân Hưng, Quận 7, TP.HCM',
    priceVnd: 2100000000,
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: 100,
    propertyType: 'land',
    mapPlaceholderNote: 'Static map placeholder — Quận 7 residential-plot pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-07.webp',
  },
  {
    id: 'listing-8',
    address: '9 Đường Điện Biên Phủ, Phường Vĩnh Ninh, Huế',
    priceVnd: 3100000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 105,
    propertyType: 'townhouse',
    mapPlaceholderNote: 'Static map placeholder — Huế riverside district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-08.webp',
  },
];

export function formatVndPrice(priceVnd: number): string {
  const ty = priceVnd / 1_000_000_000;
  if (ty >= 1) {
    return `${Number(ty.toFixed(2))} tỷ VND`;
  }
  const trieu = priceVnd / 1_000_000;
  return `${Number(trieu.toFixed(2))} triệu VND`;
}

export function formatListingSummary(listing: PropertyListing): string {
  const price = formatVndPrice(listing.priceVnd);
  if (listing.propertyType === 'land') {
    return `${price} · ${listing.areaSqm} m²\n${listing.mapPlaceholderNote}`;
  }
  return `${price} · ${listing.bedrooms} PN · ${listing.bathrooms} WC · ${listing.areaSqm} m²\n${listing.mapPlaceholderNote}`;
}

export function toGridItem(listing: PropertyListing): GridItem {
  return {
    id: listing.id,
    title: listing.address,
    description: formatListingSummary(listing),
    image: listing.mapPlaceholderImage,
  };
}

export const INQUIRY_EXTRA_FIELDS: InquiryField[] = [
  { name: 'propertyInterest', label: 'Property of interest (address or listing ID)', type: 'text', required: false },
];

export const agency = {
  name: 'Sông Hồng Real Estate',
  tagline: 'Curated apartment, townhouse, villa, and land listings across Vietnam.',
};

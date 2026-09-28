import type { CountryCode } from '@/api/schemas/common';

export type Coordinates = { readonly lat: number; readonly lng: number };

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

type Box = {
  readonly minLat: number;
  readonly maxLat: number;
  readonly minLng: number;
  readonly maxLng: number;
};

/**
 * DEMO APPROXIMATION: rough bounding boxes for our six markets, checked
 * smallest first so Singapore wins over Malaysia. Production resolves the
 * country server-side with a reverse-geocoding service (e.g. AWS Location).
 */
const MARKET_BOXES: readonly (readonly [CountryCode, readonly Box[]])[] = [
  ['SG', [{ minLat: 1.15, maxLat: 1.48, minLng: 103.59, maxLng: 104.1 }]],
  ['HK', [{ minLat: 22.13, maxLat: 22.57, minLng: 113.82, maxLng: 114.45 }]],
  [
    'MY',
    [
      { minLat: 0.85, maxLat: 7.4, minLng: 99.6, maxLng: 104.6 },
      { minLat: 0.85, maxLat: 7.4, minLng: 109.5, maxLng: 119.3 },
    ],
  ],
  ['TH', [{ minLat: 5.6, maxLat: 20.5, minLng: 97.3, maxLng: 105.7 }]],
  ['VN', [{ minLat: 8.4, maxLat: 23.4, minLng: 102.1, maxLng: 109.5 }]],
  ['AU', [{ minLat: -44, maxLat: -10, minLng: 112, maxLng: 154 }]],
];

/** Which of our markets a point falls in, or null if none. */
export function marketAt({ lat, lng }: Coordinates): CountryCode | null {
  for (const [code, boxes] of MARKET_BOXES) {
    if (
      boxes.some((b) => lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng)
    ) {
      return code;
    }
  }
  return null;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('en')} km`;
}

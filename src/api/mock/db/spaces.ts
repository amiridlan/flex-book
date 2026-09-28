import type { BrandId } from '../../schemas/brand';
import type { CountryCode, CurrencyCode } from '../../schemas/common';
import type { RateUnit, Space, SpaceType } from '../../schemas/location';
import { COUNTRIES } from './countries';
import { LOCATIONS } from './locations';

type SpaceTemplate = {
  readonly key: string;
  readonly type: SpaceType;
  readonly name: string;
  readonly capacity: number;
  readonly unit: RateUnit;
  readonly amenities: readonly string[];
};

const TEMPLATES: readonly SpaceTemplate[] = [
  {
    key: 'hotdesk',
    type: 'hot_desk',
    name: 'Hot desk day pass',
    capacity: 1,
    unit: 'day',
    amenities: ['Any open desk', 'Coffee & tea'],
  },
  {
    key: 'room-s',
    type: 'meeting_room',
    name: 'Meeting room (4 pax)',
    capacity: 4,
    unit: 'hour',
    amenities: ['TV screen', 'Whiteboard'],
  },
  {
    key: 'room-l',
    type: 'meeting_room',
    name: 'Boardroom (10 pax)',
    capacity: 10,
    unit: 'hour',
    amenities: ['Video conferencing', 'Whiteboard'],
  },
  {
    key: 'office',
    type: 'private_office',
    name: 'Private office (4 pax)',
    capacity: 4,
    unit: 'month',
    amenities: ['Lockable door', 'Mail handling'],
  },
];

/** Base prices in minor units per market (sen, cents; VND has no minor unit). */
const BASE_PRICES: Readonly<Record<CountryCode, Readonly<Record<string, number>>>> = {
  MY: { hotdesk: 5_000, 'room-s': 6_000, 'room-l': 15_000, office: 180_000 },
  SG: { hotdesk: 3_500, 'room-s': 5_000, 'room-l': 12_000, office: 150_000 },
  HK: { hotdesk: 22_000, 'room-s': 30_000, 'room-l': 70_000, office: 900_000 },
  VN: { hotdesk: 250_000, 'room-s': 350_000, 'room-l': 800_000, office: 12_000_000 },
  TH: { hotdesk: 45_000, 'room-s': 60_000, 'room-l': 150_000, office: 1_800_000 },
  AU: { hotdesk: 4_500, 'room-s': 6_000, 'room-l': 15_000, office: 200_000 },
};

const BRAND_MULTIPLIER: Readonly<Record<BrandId, number>> = { tcg: 1, hive: 1.1, clustered: 0.9 };

function currencyOf(code: CountryCode): CurrencyCode {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) throw new Error(`Unknown country ${code}`);
  return country.currency;
}

export const SPACES: readonly Space[] = LOCATIONS.flatMap((location) =>
  TEMPLATES.map((template) => {
    const base = BASE_PRICES[location.countryCode][template.key] ?? 0;
    // Round to a whole major unit (or 1,000 VND) so prices look like real price lists.
    const step = location.countryCode === 'VN' ? 1_000 : 100;
    const amountMinor = Math.round((base * BRAND_MULTIPLIER[location.brandId]) / step) * step;
    return {
      id: `${location.id}__${template.key}`,
      locationId: location.id,
      type: template.type,
      name: template.name,
      capacity: template.capacity,
      amenities: template.amenities,
      rate: {
        unit: template.unit,
        price: { amountMinor, currency: currencyOf(location.countryCode) },
      },
    };
  }),
);

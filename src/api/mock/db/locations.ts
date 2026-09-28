import type { BrandId } from '../../schemas/brand';
import type { CountryCode } from '../../schemas/common';
import type { Location } from '../../schemas/location';

type OpeningHours = Location['openingHours'];

const WEEKDAYS_AND_SAT: OpeningHours = [
  { opens: '08:00', closes: '20:00' },
  { opens: '08:00', closes: '20:00' },
  { opens: '08:00', closes: '20:00' },
  { opens: '08:00', closes: '20:00' },
  { opens: '08:00', closes: '20:00' },
  { opens: '09:00', closes: '17:00' },
  null,
];

const EVERY_DAY: OpeningHours = [
  { opens: '07:00', closes: '22:00' },
  { opens: '07:00', closes: '22:00' },
  { opens: '07:00', closes: '22:00' },
  { opens: '07:00', closes: '22:00' },
  { opens: '07:00', closes: '22:00' },
  { opens: '08:00', closes: '20:00' },
  { opens: '08:00', closes: '20:00' },
];

const DEFAULT_RULES = { sameDayRadiusKm: 30, checkInRadiusM: 200 } as const;

type Seed = {
  readonly id: string;
  readonly brandId: BrandId;
  readonly countryCode: CountryCode;
  readonly city: string;
  readonly name: string;
  readonly address: string;
  readonly lat: number;
  readonly lng: number;
  readonly timezone: string;
  readonly amenities: readonly string[];
  readonly openingHours?: OpeningHours;
};

// Fictional buildings and streets. Coordinates are real city areas so distance checks are meaningful.
const SEEDS: readonly Seed[] = [
  // Malaysia
  {
    id: 'loc_tcg_kul',
    brandId: 'tcg',
    countryCode: 'MY',
    city: 'Kuala Lumpur',
    name: 'Menara Aurora',
    address: 'Level 12, Menara Aurora, Jalan Ampang Utama, 50450 Kuala Lumpur',
    lat: 3.1478,
    lng: 101.7065,
    timezone: 'Asia/Kuala_Lumpur',
    amenities: ['Wi-Fi', 'Coffee bar', 'Phone booths', 'Showers'],
  },
  {
    id: 'loc_hive_kul',
    brandId: 'hive',
    countryCode: 'MY',
    city: 'Kuala Lumpur',
    name: 'Bangsar Loft',
    address: '3F, Wisma Lumina, Jalan Telawi Baru, 59100 Kuala Lumpur',
    lat: 3.1301,
    lng: 101.6712,
    timezone: 'Asia/Kuala_Lumpur',
    amenities: ['Wi-Fi', 'Podcast studio', 'Rooftop', 'Bike racks'],
    openingHours: EVERY_DAY,
  },
  {
    id: 'loc_clustered_pen',
    brandId: 'clustered',
    countryCode: 'MY',
    city: 'Penang',
    name: 'Straits Quay House',
    address: '8, Lebuh Seri Pantai, 10200 George Town, Penang',
    lat: 5.4164,
    lng: 100.3327,
    timezone: 'Asia/Kuala_Lumpur',
    amenities: ['Wi-Fi', 'Parking', 'Printing'],
  },
  // Singapore
  {
    id: 'loc_tcg_sin',
    brandId: 'tcg',
    countryCode: 'SG',
    city: 'Singapore',
    name: 'Telok Commons',
    address: '21 Telok Ayer Lane, #04-01, Singapore 068900',
    lat: 1.2812,
    lng: 103.8478,
    timezone: 'Asia/Singapore',
    amenities: ['Wi-Fi', 'Coffee bar', 'Wellness room'],
  },
  {
    id: 'loc_hive_sin',
    brandId: 'hive',
    countryCode: 'SG',
    city: 'Singapore',
    name: 'Kallang Works',
    address: '9 Kallang Riverside Road, #02-10, Singapore 339950',
    lat: 1.3105,
    lng: 103.8653,
    timezone: 'Asia/Singapore',
    amenities: ['Wi-Fi', 'Event hall', 'Showers'],
    openingHours: EVERY_DAY,
  },
  {
    id: 'loc_clustered_sin',
    brandId: 'clustered',
    countryCode: 'SG',
    city: 'Singapore',
    name: 'one-north Hub',
    address: '55 Fusion Crescent, #07-05, Singapore 138600',
    lat: 1.2995,
    lng: 103.7872,
    timezone: 'Asia/Singapore',
    amenities: ['Wi-Fi', 'Parking', 'Printing', 'Lockers'],
  },
  // Hong Kong
  {
    id: 'loc_tcg_hkg',
    brandId: 'tcg',
    countryCode: 'HK',
    city: 'Hong Kong',
    name: 'Wing Lok Yard',
    address: '18/F, 88 Wing Lok Terrace, Sheung Wan, Hong Kong',
    lat: 22.2866,
    lng: 114.1515,
    timezone: 'Asia/Hong_Kong',
    amenities: ['Wi-Fi', 'Coffee bar', 'Phone booths'],
  },
  {
    id: 'loc_hive_hkg',
    brandId: 'hive',
    countryCode: 'HK',
    city: 'Hong Kong',
    name: 'Wan Chai Studio',
    address: '11/F, 23 Lockhart Crescent, Wan Chai, Hong Kong',
    lat: 22.2776,
    lng: 114.1747,
    timezone: 'Asia/Hong_Kong',
    amenities: ['Wi-Fi', 'Rooftop', 'Podcast studio'],
    openingHours: EVERY_DAY,
  },
  {
    id: 'loc_clustered_hkg',
    brandId: 'clustered',
    countryCode: 'HK',
    city: 'Hong Kong',
    name: 'Quarry Bay Centre',
    address: '26/F, 979 Harbourline Road, Quarry Bay, Hong Kong',
    lat: 22.2873,
    lng: 114.2127,
    timezone: 'Asia/Hong_Kong',
    amenities: ['Wi-Fi', 'Printing', 'Lockers'],
  },
  // Vietnam
  {
    id: 'loc_tcg_sgn',
    brandId: 'tcg',
    countryCode: 'VN',
    city: 'Ho Chi Minh City',
    name: 'Saigon Garden House',
    address: '42 Le Thanh Ton Street, District 1, Ho Chi Minh City',
    lat: 10.7797,
    lng: 106.7036,
    timezone: 'Asia/Ho_Chi_Minh',
    amenities: ['Wi-Fi', 'Coffee bar', 'Garden'],
  },
  {
    id: 'loc_hive_han',
    brandId: 'hive',
    countryCode: 'VN',
    city: 'Hanoi',
    name: 'Hoan Kiem Atelier',
    address: '17 Trang Tien Lane, Hoan Kiem, Hanoi',
    lat: 21.0245,
    lng: 105.8561,
    timezone: 'Asia/Ho_Chi_Minh',
    amenities: ['Wi-Fi', 'Event hall', 'Phone booths'],
    openingHours: EVERY_DAY,
  },
  {
    id: 'loc_clustered_sgn',
    brandId: 'clustered',
    countryCode: 'VN',
    city: 'Ho Chi Minh City',
    name: 'Thao Dien Point',
    address: '9 Quoc Huong Street, Thu Duc City, Ho Chi Minh City',
    lat: 10.8036,
    lng: 106.7322,
    timezone: 'Asia/Ho_Chi_Minh',
    amenities: ['Wi-Fi', 'Parking', 'Printing'],
  },
  // Thailand
  {
    id: 'loc_tcg_bkk',
    brandId: 'tcg',
    countryCode: 'TH',
    city: 'Bangkok',
    name: 'Ari Commons',
    address: '5 Soi Ari Samphan 9, Phaya Thai, Bangkok 10400',
    lat: 13.7797,
    lng: 100.5446,
    timezone: 'Asia/Bangkok',
    amenities: ['Wi-Fi', 'Coffee bar', 'Showers'],
  },
  {
    id: 'loc_hive_bkk',
    brandId: 'hive',
    countryCode: 'TH',
    city: 'Bangkok',
    name: 'Sathorn Studio',
    address: '120 North Sathorn Lane, Silom, Bangkok 10500',
    lat: 13.7236,
    lng: 100.5294,
    timezone: 'Asia/Bangkok',
    amenities: ['Wi-Fi', 'Rooftop', 'Event hall'],
    openingHours: EVERY_DAY,
  },
  {
    id: 'loc_clustered_cnx',
    brandId: 'clustered',
    countryCode: 'TH',
    city: 'Chiang Mai',
    name: 'Nimman Works',
    address: '14 Nimmanhaemin Soi 6, Suthep, Chiang Mai 50200',
    lat: 18.7966,
    lng: 98.9681,
    timezone: 'Asia/Bangkok',
    amenities: ['Wi-Fi', 'Garden', 'Bike racks'],
  },
  // Australia (Sydney/Melbourne observe DST; Brisbane does not)
  {
    id: 'loc_tcg_syd',
    brandId: 'tcg',
    countryCode: 'AU',
    city: 'Sydney',
    name: 'Surry Hills Yard',
    address: 'Level 3, 60 Foveaux Lane, Surry Hills NSW 2010',
    lat: -33.8836,
    lng: 151.2108,
    timezone: 'Australia/Sydney',
    amenities: ['Wi-Fi', 'Coffee bar', 'Showers', 'Bike racks'],
  },
  {
    id: 'loc_hive_mel',
    brandId: 'hive',
    countryCode: 'AU',
    city: 'Melbourne',
    name: 'Collingwood Works',
    address: '44 Easey Lane, Collingwood VIC 3066',
    lat: -37.8026,
    lng: 144.9874,
    timezone: 'Australia/Melbourne',
    amenities: ['Wi-Fi', 'Podcast studio', 'Rooftop'],
    openingHours: EVERY_DAY,
  },
  {
    id: 'loc_clustered_bne',
    brandId: 'clustered',
    countryCode: 'AU',
    city: 'Brisbane',
    name: 'Fortitude Valley House',
    address: 'Level 5, 12 Brunswick Mews, Fortitude Valley QLD 4006',
    lat: -27.4575,
    lng: 153.0355,
    timezone: 'Australia/Brisbane',
    amenities: ['Wi-Fi', 'Parking', 'Printing'],
  },
];

export const LOCATIONS: readonly Location[] = SEEDS.map((seed) => ({
  ...seed,
  openingHours: seed.openingHours ?? WEEKDAYS_AND_SAT,
  bookingRules: DEFAULT_RULES,
}));

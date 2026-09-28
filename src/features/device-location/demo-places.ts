/**
 * DEMO ONLY: preset device positions so the distance rule can be shown from
 * anywhere. Chosen in Profile → Demo location. Never shipped in a store build.
 */
export type DemoPlace = {
  readonly id: string;
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
  /** Simulates Android's mock-location flag (a fake-GPS app). */
  readonly mocked: boolean;
};

export const DEMO_PLACES: readonly DemoPlace[] = [
  { id: 'kl', label: 'Kuala Lumpur city centre', lat: 3.1528, lng: 101.7038, mocked: false },
  {
    id: 'kl-onsite',
    label: 'At Menara Aurora (on site)',
    lat: 3.1478,
    lng: 101.7065,
    mocked: false,
  },
  { id: 'penang', label: 'Penang', lat: 5.4141, lng: 100.3288, mocked: false },
  { id: 'singapore', label: 'Singapore', lat: 1.2834, lng: 103.8607, mocked: false },
  { id: 'sydney', label: 'Sydney CBD', lat: -33.8688, lng: 151.2093, mocked: false },
  { id: 'hcmc', label: 'Ho Chi Minh City', lat: 10.7769, lng: 106.7009, mocked: false },
  { id: 'bangkok', label: 'Bangkok', lat: 13.7563, lng: 100.5018, mocked: false },
  { id: 'hongkong', label: 'Hong Kong', lat: 22.2819, lng: 114.158, mocked: false },
  { id: 'fake-gps', label: 'Fake GPS app (KL)', lat: 3.1478, lng: 101.7065, mocked: true },
];

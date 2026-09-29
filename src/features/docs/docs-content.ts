/**
 * Content for the in-app Documentation page. Plain data so it can be edited
 * without touching layout code. Versions mirror package.json and backend/composer.json.
 */

export type DocSectionId =
  'overview' | 'try-it' | 'stack' | 'architecture' | 'hosting' | 'security' | 'next';

export type DocSection = { readonly id: DocSectionId; readonly title: string };

/**
 * The "On this page" list. The opening section ('overview') is left out: it sits at
 * the top of the page, so the list starts with what comes after it.
 */
export const DOC_SECTIONS: readonly DocSection[] = [
  { id: 'try-it', title: 'Try the demo' },
  { id: 'stack', title: 'Tech stack' },
  { id: 'architecture', title: 'How it fits together' },
  { id: 'hosting', title: 'Hosting and delivery' },
  { id: 'security', title: 'Security and privacy' },
  { id: 'next', title: 'What comes next' },
];

export const OVERVIEW =
  'FlexiSpace is a booking app for a coworking group with three brands (The Common Ground, Hive and Clustered) across Malaysia, Singapore, Hong Kong, Vietnam, Thailand and Australia. Members book desks and rooms at any brand in any country. Front-desk staff see only the brand or location they work for, check members in and add walk-ins. One codebase runs on Android, iOS and the web.';

export const DISCLAIMER =
  'Not affiliated with Flexi Group. Every person, company and booking in this demo is fictional.';

export const HIGHLIGHTS: readonly { readonly title: string; readonly body: string }[] = [
  {
    title: 'One app, three brands',
    body: 'Members see every brand. Staff see only their own brand or single location; the API enforces this, the screens just follow it.',
  },
  {
    title: 'Six countries, done properly',
    body: 'Each location shows its own local time (including Australian daylight saving), its own currency and its own sales tax.',
  },
  {
    title: 'No fake bookings',
    body: 'Same-day bookings need the phone within 30 km; later days need it in the same country; fake-GPS apps are refused. The server checks again.',
  },
  {
    title: 'Front desk on a phone',
    body: 'Staff get today’s board, QR or code check-in, walk-in bookings, and automatic no-shows 15 minutes after the start.',
  },
  {
    title: 'Backend-ready',
    body: 'The app talks to a mock of the real API. Switching to the Laravel backend is one setting, not a rewrite.',
  },
];

export const DEMO_TIPS: readonly string[] = [
  'Pick any demo account on the sign-in page. No password is needed.',
  'Profile → Demo location lets you pretend to be in Sydney, on site, or on a fake-GPS app, to see the distance rule block or allow a booking.',
  'On a laptop the app switches to a desktop layout with a sidebar and tables. Narrow the window to see the phone layout.',
];

export type StackItem = {
  readonly name: string;
  readonly version: string;
  /** What it does in this app, in plain words. */
  readonly role: string;
};

export type StackGroup = { readonly title: string; readonly items: readonly StackItem[] };

export const STACK: readonly StackGroup[] = [
  {
    title: 'App foundation',
    items: [
      {
        name: 'React Native',
        version: '0.86',
        role: 'Draws real native screens on Android and iOS from one React codebase.',
      },
      {
        name: 'Expo',
        version: 'SDK 57',
        role: 'The toolkit around React Native: builds, device APIs, over-the-air updates and the web export.',
      },
      {
        name: 'React Native Web',
        version: '0.21',
        role: 'Turns the same screens into a website, which is what runs in the browser.',
      },
      {
        name: 'React',
        version: '19.2',
        role: 'The component model every screen is built with.',
      },
      {
        name: 'TypeScript',
        version: '6 (strict)',
        role: 'Catches mistakes before the app runs. No untyped data anywhere.',
      },
      {
        name: 'Expo Router',
        version: '57',
        role: 'File-based navigation, deep links and the guards that keep members and staff in their own areas.',
      },
    ],
  },
  {
    title: 'Look and feel',
    items: [
      {
        name: 'NativeWind + Tailwind CSS',
        version: '4 · 3.4',
        role: 'Tailwind class names on native components. Design tokens swap per brand, so each brand gets its own colours.',
      },
      {
        name: 'Expo Vector Icons',
        version: '15',
        role: 'The Ionicons set used in tabs, the sidebar and buttons.',
      },
    ],
  },
  {
    title: 'Data and forms',
    items: [
      {
        name: 'TanStack Query',
        version: '5',
        role: 'Fetches, caches and refreshes server data, and drives the loading, error and retry states.',
      },
      {
        name: 'Zod',
        version: '4',
        role: 'Checks every API response against the contract, and generates the OpenAPI file for the backend team.',
      },
      {
        name: 'Zustand',
        version: '5',
        role: 'Small stores for the signed-in session and the demo location.',
      },
      {
        name: 'React Hook Form',
        version: '7',
        role: 'The walk-in form, with Laravel-style 422 errors shown on the matching fields.',
      },
      {
        name: 'date-fns + @date-fns/tz',
        version: '4 · 1.5',
        role: 'Shows every time in the location’s own timezone and handles daylight-saving changes.',
      },
    ],
  },
  {
    title: 'Device features',
    items: [
      {
        name: 'expo-location',
        version: '57',
        role: 'Reads the phone’s position for the distance rule and check-in, and spots mocked GPS.',
      },
      {
        name: 'expo-camera',
        version: '57',
        role: 'Scans members’ check-in QR codes at the front desk.',
      },
      {
        name: 'qrcode',
        version: '1.5',
        role: 'Builds the check-in QR code, drawn with plain views so it works everywhere.',
      },
    ],
  },
  {
    title: 'Backend (in the repo, not hosted yet)',
    items: [
      {
        name: 'Laravel',
        version: '12 · PHP 8.2+',
        role: 'The real API: locations, availability, bookings and check-in, with the same distance rule run on the server.',
      },
      {
        name: 'Laravel Sanctum',
        version: '4',
        role: 'Token sign-in for the app. Staff can only reach their own brand or location.',
      },
      {
        name: 'MySQL / MariaDB',
        version: '8 · 10.11',
        role: 'The database design, with row locks so two people cannot book the same slot.',
      },
    ],
  },
  {
    title: 'Quality and delivery',
    items: [
      {
        name: 'Jest + Testing Library',
        version: '29 · 14',
        role: 'Fast tests without a browser: the rules (distance, time zones, money) and screen flows on phone and desktop layouts.',
      },
      {
        name: 'Playwright',
        version: '1.63',
        role: 'End-to-end tests in a real Chrome browser at laptop and phone sizes: booking, the distance rule with simulated GPS, staff check-in and walk-ins, time zones.',
      },
      {
        name: 'PHPUnit + Pint',
        version: '11 · 1',
        role: 'API feature tests and PHP code style for the Laravel backend.',
      },
      {
        name: 'ESLint + Prettier',
        version: '9 · 3',
        role: 'Lint and formatting rules, checked on every push.',
      },
      {
        name: 'GitHub Actions',
        version: 'CI',
        role: 'Runs typecheck, lint, unit tests, the web build and the Playwright tests for the app, plus the Laravel tests, on every push and pull request.',
      },
      {
        name: 'EAS Workflows + EAS Update',
        version: 'Expo',
        role: 'Publishes an over-the-air update on every push to main, and builds the Android preview APK on demand.',
      },
      {
        name: 'Netlify',
        version: 'Web',
        role: 'Builds and hosts the web version as a static site.',
      },
    ],
  },
];

export type Layer = { readonly name: string; readonly detail: string };

/** Top to bottom: how a screen gets its data. */
export const LAYERS: readonly Layer[] = [
  { name: 'Screens', detail: 'Expo Router pages in src/app. Layout and user input only.' },
  { name: 'Query hooks', detail: 'TanStack Query: caching, loading, error and retry.' },
  { name: 'Repositories', detail: 'One per feature: auth, locations, bookings, staff.' },
  { name: 'ApiClient', detail: 'Sends every request and validates every response with Zod.' },
];

/** The ApiClient hands requests to one of these, chosen by EXPO_PUBLIC_API_MODE. */
export const TRANSPORTS: readonly (Layer & { readonly tag: string })[] = [
  {
    name: 'Mock server',
    tag: 'Today',
    detail:
      'Runs inside the app with fictional seed data. Same paths, status codes and JSON as Laravel.',
  },
  {
    name: 'Laravel 12 API',
    tag: 'Next',
    detail: 'HTTP to the real backend on AWS, backed by MySQL or MariaDB.',
  },
];

export const SHARED_RULES =
  'Business rules live in src/domain and are shared by the app and the mock server: the distance rule, the check-in window, cancellation cut-off, the QR payload and email masking. The Laravel backend implements the same rules and its tests use the same seed data.';

export type HostingStatus = 'live' | 'ready' | 'planned';

export type HostingRow = {
  readonly part: string;
  readonly where: string;
  readonly how: string;
  readonly status: HostingStatus;
};

export const HOSTING: readonly HostingRow[] = [
  {
    part: 'Source code',
    where: 'GitHub (amiridlan/flex-book)',
    how: 'One repo for the app and the backend.',
    status: 'live',
  },
  {
    part: 'Web app',
    where: 'Netlify',
    how: 'Static export (npm run build:web), rebuilt on every push to main.',
    status: 'live',
  },
  {
    part: 'Mobile app',
    where: 'Expo (EAS Update, project amiridlan-team/amir)',
    how: 'Over-the-air update on every push to main. Opens in Expo Go or the Android preview APK.',
    status: 'live',
  },
  {
    part: 'Checks',
    where: 'GitHub Actions',
    how: 'App checks, web build, Playwright end-to-end tests and Laravel tests on every push and pull request.',
    status: 'live',
  },
  {
    part: 'API',
    where: 'Inside the app (mock server)',
    how: 'The Laravel 12 API is written and tested in backend/; the target host is AWS.',
    status: 'ready',
  },
  {
    part: 'Database',
    where: 'Seed data in the app',
    how: 'Target: MySQL or MariaDB on Amazon RDS, loaded from the same seed fixtures.',
    status: 'planned',
  },
];

export const HOSTING_STATUS_LABELS: Readonly<Record<HostingStatus, string>> = {
  live: 'Live',
  ready: 'Built, not hosted',
  planned: 'Planned',
};

export const SECURITY: readonly string[] = [
  'Sign-in is demo only. The real build uses Laravel Sanctum tokens kept in the phone’s secure storage, never plain storage.',
  'The app’s distance check is only for a fast answer; the server re-checks every booking and check-in.',
  'Staff see member emails masked (a***@example.com). Nothing sensitive is collected, in line with Malaysia’s PDPA 2010.',
  'No secrets, API keys or tokens are stored in the app or the repo.',
  'The web version sends strict security headers (no framing, no MIME sniffing, location and camera for this site only).',
];

export const NEXT_STEPS: readonly string[] = [
  'Host the Laravel API and database on AWS and switch the app to it.',
  'Real email and password sign-in with Sanctum.',
  'Payments, receipts and invoices per country.',
  'Push notifications before a booking starts and when check-in opens.',
  'A map view of locations (needs a Google Maps key for Android builds).',
];

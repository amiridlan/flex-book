# FlexiSpace

A coworking space booking app for a multi-brand operator across Asia Pacific and Australia, built with React Native (Expo) and TypeScript.

> Concept demo built for an interview. Not affiliated with Flexi Group. All data is fictional.

## Highlights

- **One app, three brands.** Members browse every brand in every country; staff see only the brand they work for.
- **Six markets, done properly.** Times render in each location's timezone (including Australian daylight saving); prices use each market's currency.
- **Location-aware booking.** Same-day bookings need you within 30 km of the space; future bookings need you in the same country. The server re-checks.
- **Backend-ready.** Screens talk to repositories, not endpoints. One setting swaps the mock adapter for a Laravel 12 + MySQL/MariaDB API.

## Stack

Expo SDK 57 · React Native 0.86 · TypeScript (strict) · Expo Router · NativeWind · Jest + React Native Testing Library · ESLint + Prettier

## Scripts

```bash
npm ci               # install from the lockfile
npm start            # Expo dev server (scan the QR code with Expo Go)
npm run check        # typecheck, lint, format check, tests
npm run build:web    # static web export to dist/ (deployed on Netlify)
```

## Docs

- [`docs/01-prd.md`](docs/01-prd.md): product requirements, markets, roles, distance rule, build phases.

# FlexiSpace

A coworking space booking app for a multi-brand operator across Asia Pacific and Australia, built with React Native (Expo) and TypeScript.

> Concept demo built for an interview. Not affiliated with Flexi Group. All data is fictional.

## Highlights

- **One app, three brands.** Members browse every brand in every country; staff see only the brand, or the single location, they work for. The API enforces the scope; the UI only follows it.
- **Six markets, done properly.** Times are stored in UTC and shown in each location's own timezone, including Australian daylight saving. Prices are integer minor units in each market's currency, with that country's tax.
- **Anti-fake-booking.** Same-day bookings need the phone within 30 km of the space; later days need it in the same country; mocked GPS is refused. The same rule runs again on the server. Unclaimed bookings become no-shows 15 minutes after the start and the space is released.
- **Front desk in your pocket.** Staff see today's board, check members in by scanning their QR (or typing the booking code) and book walk-ins.
- **Backend-ready.** Screens talk to repositories, repositories to one `ApiClient`, and the `ApiClient` to a transport. The mock is an in-process fake of the Laravel API; switching to the real one is `EXPO_PUBLIC_API_MODE=http`.

## Architecture

```
Screens (Expo Router) ──> TanStack Query hooks ──> Repositories ──> ApiClient (Zod-validated)
                                                                      │
                                              ┌───────────────────────┴───────────────────────┐
                                        Mock server (demo)                      Fetch transport
                                  same paths, statuses, JSON                 Laravel 12 + Sanctum
                                                                              MySQL / MariaDB (RDS)
Shared rules (src/domain): distance rule, cancellation, check-in window, QR payload, privacy
```

| Folder                        | What lives there                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `src/app`                     | Routes only: `(member)` tabs and detail stack, `staff/` tabs, `login`                 |
| `src/api`                     | Zod schemas (the contract), `ApiClient`, repositories, mock server, OpenAPI generator |
| `src/domain`                  | Pure business rules shared by the app and the (mock) server                           |
| `src/features`                | Hooks and components per feature: auth, booking, locations, staff, device-location    |
| `src/lib`                     | Time zones, money, query client, form-error mapping                                   |
| `docs/openapi.json`           | API contract for the backend team, generated from the Zod schemas                     |
| `backend/database/schema.sql` | MySQL 8 / MariaDB 10.11 schema with indexes and the double-booking strategy           |

## Demo accounts

| Account                              | Sees                                         |
| ------------------------------------ | -------------------------------------------- |
| Member (Aisyah)                      | Every brand and country; books and checks in |
| Staff · Hive (Daniel)                | All six Hive locations                       |
| Staff · The Common Ground KL (Priya) | One location only                            |
| Brand admin · Clustered (Minh)       | Every Clustered location                     |
| Group admin (Sarah)                  | All brands                                   |

Profile → **Demo location** lets the presenter "be" in Sydney, on site, or on a fake-GPS app, to show the distance rule live.

## Stack

Expo SDK 57 · React Native 0.86 · TypeScript (strict) · Expo Router · NativeWind · TanStack Query · Zustand · Zod · React Hook Form · date-fns + @date-fns/tz · expo-location · expo-camera · Jest + React Native Testing Library · ESLint + Prettier · EAS Update · Netlify (web)

## Scripts

```bash
npm ci               # install from the lockfile
npm start            # Expo dev server
npm run check        # typecheck, lint, format check, tests
npm run build:web    # static web export to dist/ (deployed on Netlify)
npm run openapi      # regenerate docs/openapi.json from the Zod schemas
```

## Docs

- [`docs/01-prd.md`](docs/01-prd.md): product requirements, markets, roles, distance rule, build phases.
- [`docs/openapi.json`](docs/openapi.json): the API contract (open in any OpenAPI viewer).
- [`backend/database/schema.sql`](backend/database/schema.sql): database design.

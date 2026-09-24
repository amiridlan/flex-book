# FlexiSpace — PRD summary

Repo copy of the working PRD (the live version is a Claude Doc shared with the developer). Decisions dated 24/09/2026. Demo date: **Mon 28/09/2026** (front-end developer interview).

## Product

A React Native (Expo) booking app for a coworking group with three brands: **The Common Ground**, **Hive** and **Clustered**. Concept demo; not affiliated with Flexi Group. Brand names are text only, no logos.

- Members browse every brand in every country.
- Staff see only the brand(s), and optionally locations, they are assigned to.
- Booking is restricted by device location to block fake bookings.
- Frontend-only for now, on a mock API. A PHP (Laravel 12) + MySQL/MariaDB API on AWS replaces it later.

## Markets (18 mock locations: 3 brands × 6 countries)

| Country   | Currency | Timezone                                                  | The Common Ground | Hive         | Clustered        |
| --------- | -------- | --------------------------------------------------------- | ----------------- | ------------ | ---------------- |
| Malaysia  | MYR      | Asia/Kuala_Lumpur                                         | Kuala Lumpur      | Kuala Lumpur | Penang           |
| Singapore | SGD      | Asia/Singapore                                            | Singapore         | Singapore    | Singapore        |
| Hong Kong | HKD      | Asia/Hong_Kong                                            | Hong Kong         | Hong Kong    | Hong Kong        |
| Vietnam   | VND      | Asia/Ho_Chi_Minh                                          | Ho Chi Minh City  | Hanoi        | Ho Chi Minh City |
| Thailand  | THB      | Asia/Bangkok                                              | Bangkok           | Bangkok      | Chiang Mai       |
| Australia | AUD      | Australia/Sydney, Australia/Melbourne, Australia/Brisbane | Sydney            | Melbourne    | Brisbane         |

Sydney and Melbourne observe daylight saving (UTC+11 from 04/10/2026); Brisbane does not.

## Roles

| Role          | Sees                               | Can do                                                      |
| ------------- | ---------------------------------- | ----------------------------------------------------------- |
| `member`      | All brands, all countries          | Browse, book (distance rule), check in, manage own bookings |
| `staff`       | Assigned brand(s) / locations only | Today board, check-in (QR), walk-ins, block rooms           |
| `brand_admin` | Whole brand                        | Staff features + spaces, rates, stats                       |
| `group_admin` | All brands                         | Everything                                                  |

Screens check **permissions** (e.g. `bookings.checkin`), never role names. The server enforces brand scope; the app only shapes the UI. Staff mode lives in the mobile app for floor tasks; admin configuration and reports go to a web dashboard later.

## Distance rule (anti-fake booking)

| Booking type          | Rule                                            |
| --------------------- | ----------------------------------------------- |
| Same-day              | Device within 30 km of the location             |
| Future (1+ day ahead) | Device in the same country as the location      |
| Check-in              | Device within 200 m, or staff scans the QR code |

Plus: permission explainer, "location unavailable" fallback, block mocked GPS (`mocked` flag on Android), server re-checks every booking. A dev-menu location simulator makes the rule demoable from Malaysia.

## Regional rules

- API sends UTC ISO 8601. Each location has an IANA timezone; slots and hours render in the location's zone with a zone label.
- Never add fixed offsets. Use `date-fns` v4 + `@date-fns/tz`.
- Money is integer minor units + ISO currency, formatted with `Intl.NumberFormat` (VND with no decimals).
- Tax rate and label come from the API per country; never hard-coded.
- Dates DD/MM/YYYY, times 12-hour (`h:mm a`).

## Architecture

```
Screens -> query hooks (TanStack Query) -> repositories -> ApiClient
                                                          |-- mock adapter + seed data  (EXPO_PUBLIC_API_MODE=mock)
                                                          `-- http adapter -> Laravel 12 API -> MySQL/MariaDB (RDS)
```

- Zod schemas are the API contract; every response is parsed.
- Mock copies Laravel conventions: `{ data, meta, links }` pagination, 422 `{ message, errors }`, Bearer tokens.
- Mock adds latency and random failures so error states are real.
- Real auth later: Laravel Sanctum tokens in `expo-secure-store`.

## Build phases

| Phase | Scope                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------- |
| P0    | Repo, Expo scaffold, NativeWind, lint/test/format, Netlify web preview                          |
| P1    | Theme tokens + 3 brand themes, API client + mock adapter, seed data, mock auth + role picker    |
| P2    | Explore, results, location + space detail, slot picker, timezone and currency formatting        |
| P3    | Distance rule, booking review/confirm, My Bookings, QR check-in, location simulator             |
| P4    | Staff mode (today board, scanner, walk-in), brand scoping, polish, `schema.sql`, `openapi.yaml` |
| P5    | Laravel 12 skeleton in `backend/` (migrations, seeders, Sanctum, 3 endpoints)                   |

## Demo script (5 minutes)

1. Log in as a member in KL: home picks Malaysia, prices in RM.
2. Browse Hive in Sydney: prices in AUD, slots in Sydney time with the zone label.
3. Try to book a Sydney hot desk for today: blocked, distance shown.
4. Simulate being in Sydney: booking goes through, QR appears.
5. Log in as Hive staff: only Hive locations; check the member in.
6. Switch to The Common Ground staff: Hive data is gone.
7. Close on the architecture: one setting swaps mock for Laravel + MySQL on AWS.

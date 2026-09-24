@AGENTS.md

# CLAUDE.md — FlexiSpace (flex-book)

Instructions for Claude Code. Read this file and `docs/01-prd.md` before any task.

## Project

FlexiSpace is a coworking space booking app for a group with three brands (The Common Ground, Hive, Clustered) in six countries (MY, SG, HK, VN, TH, AU). It is a **concept demo** for a front-end developer interview on **Mon 28/09/2026**. Not affiliated with Flexi Group.

It is **frontend-only**, backed by a **mock API adapter** with fictional data. A Laravel 12 + MySQL/MariaDB API on AWS replaces the mock later, so screens talk to data only through repositories and the `ApiClient`.

## Environment (read first)

- Developed in **Claude Code on the web** cloud sessions. The developer has no local setup and **cannot view `localhost`**. Never ask them to open a local URL.
- Verify work with `npm run check` and `npm run build:web`. The developer reviews UI on the **Netlify deploy preview** of the PR, and device features on their phone via **Expo Go**.
- No simulators in the cloud. To prove native code compiles, run `npx expo export --platform android` (and `ios`) with `--output-dir` pointing at the scratchpad.
- **`docs.expo.dev` and `api.expo.dev` are blocked** by the network allowlist. For Expo APIs, read the package's types and README in `node_modules/`. Run `npx expo install` as `EXPO_OFFLINE=1 npx expo install <pkg>` (it resolves SDK-compatible versions from the local `expo` package).
- Every command must be non-interactive. Never leave `expo start` or other long-running processes running.

## Stack

Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 (strict), Expo Router (typed routes), NativeWind 4 + Tailwind CSS 3.4, Jest (`jest-expo`) + React Native Testing Library 14, ESLint 9 (`eslint-config-expo`) + Prettier. npm.

Planned (add in the phase that needs them, via `EXPO_OFFLINE=1 npx expo install`): TanStack Query, Zustand, Zod, React Hook Form, date-fns v4 + @date-fns/tz, i18next, expo-location, expo-camera, expo-secure-store, react-native-maps. **Ask before adding anything not on this list.**

## Commands

```bash
npm run check        # typecheck + lint + format check + tests — must pass before every push
npm run build:web    # web export to dist/ (what Netlify runs) — must pass before every push
npm test             # jest
npm run format       # prettier --write
```

## React / React Native rules

- Function components and hooks only. Named exports for components; default exports only for Expo Router route files.
- Routes live in `src/app/`. Non-route code lives outside it: `src/components`, `src/features/<feature>`, `src/api`, `src/lib`, `src/theme`.
- Route groups separate member, staff and admin areas; guards redirect when a **permission** is missing. Check permissions, never role names.
- Server state goes through TanStack Query hooks. Components never call the `ApiClient` or mock directly.
- Client state (session, selected country, demo location) lives in small Zustand stores.
- Forms: React Hook Form + Zod resolver. Map Laravel 422 `{ message, errors }` to field errors.
- Every data view has 4 states: **loading**, **empty**, **error** (with Retry), **loaded**. Use shared components.
- Accessibility: every pressable has `accessibilityRole` and a label; touch targets ≥ 44 pt; respect dynamic type.
- Platform differences go in `.web.tsx` / `.native.tsx` files, not scattered `Platform.OS` checks (maps are native only).
- RNTL 14 `render` is async: `await render(<Screen />)`.

## TypeScript rules

- `strict`, `noUncheckedIndexedAccess`. Never `any`; use `unknown` and narrow (Zod parse at the API boundary).
- API models are `type`s inferred from Zod schemas in `src/api/schemas/`. No classes for data.
- String-literal unions for enums (`type BookingStatus = 'pending' | 'confirmed' | ...`).
- Prefer `readonly` arrays and properties.

## Styling (NativeWind)

- Style with `className`. Use `StyleSheet` only for what NativeWind cannot express, with a comment saying why.
- Use theme tokens from `tailwind.config.js` (set up in P1). No hard-coded hex values in components.
- Brand theming is data-driven: the brand's theme comes from the API and is applied through CSS variables (`vars()`), not per-brand code branches.

## Data, time and money

- API times are UTC ISO 8601. Render in the **location's** IANA timezone, with a zone label when it differs from the device. Never add fixed offsets.
- Money is integer minor units + ISO currency code, formatted with `Intl.NumberFormat`.
- Dates display `dd/MM/yyyy`, times `h:mm a`.
- Tax rate and label come from the API. Never hard-code a rate.

## Error handling

- Every repository call handles errors and returns a typed `ApiError`; queries expose it to the UI. Never swallow errors.
- 422 maps to form fields; other errors show a banner with Retry.
- A root error boundary catches render errors; log to console in dev only.

## Security rules

- Mock auth is **demo only**. Put a code comment on it saying so. Real auth is Laravel Sanctum later; tokens go in `expo-secure-store`, never AsyncStorage.
- The app-side distance check is UX only. The server re-checks every booking.
- No secrets, API keys or tokens in code, `app.json` or committed `.env` files. `EXPO_PUBLIC_*` values are public by definition.
- All seed data is fictional: no real people, emails or phone numbers. Mask member emails/phones in staff list views.
- Do not collect sensitive personal data (race, religion, health). Follows Malaysian PDPA 2010.

## Workflow

- Work one phase from `docs/01-prd.md` per session. Stop at the end of the phase and wait for the developer to say "next".
- Before pushing: `npm run check` and `npm run build:web` must pass with no new warnings.
- Small commits with Conventional Commit messages (`feat: add explore screen`). Push the session branch; the developer merges the PR.
- End every phase with a short summary: what was built, what to check on the Netlify preview / Expo Go, and the key concepts used (2–3 sentences each, with file pointers).

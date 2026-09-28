# FlexiSpace API (Laravel 12)

The backend the FlexiSpace app switches to with `EXPO_PUBLIC_API_MODE=http`. It serves the contract in [`../docs/openapi.json`](../docs/openapi.json), which is generated from the app's Zod schemas.

## What is here

| Area | Files |
| --- | --- |
| Routes (`/api/v1`) | `routes/api.php`: login (rate limited), me, brands, countries, locations, availability, bookings |
| Staff scope | `Location::scopeVisibleTo()` and `User::canSeeLocation()`: staff see only assigned brands/locations; out of scope is 404 |
| Anti-fake-booking | `app/Domain/BookingRules.php` (same rule as the app's `src/domain/booking-rules.ts`), re-run on every booking |
| Time zones | `app/Services/AvailabilityService.php`: slots built in the location's IANA zone, sent in UTC (DST-safe) |
| Double-booking | `app/Services/BookingService.php`: row lock on the space inside a transaction, then the overlap check |
| Money | Integer minor units + currency; tax rate and label snapshotted per booking |
| QR check-in | HMAC of the booking id with the app key: nothing secret stored, owner-only in responses |
| Data | Migrations in `database/migrations`; annotated MySQL/MariaDB design in `database/schema.sql`; demo data from `database/seeders/data/*.json` (exported from the app's mock with `npm run seed:export`) |

Auth is Laravel Sanctum bearer tokens. The app stores them in `expo-secure-store`.

## Run it

```bash
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite          # or set DB_CONNECTION=mysql / mariadb in .env
php artisan migrate --seed
php artisan serve                        # http://127.0.0.1:8000/api/v1
php artisan test                         # feature tests on in-memory SQLite
```

Point the app at it with `EXPO_PUBLIC_API_MODE=http` and `EXPO_PUBLIC_API_BASE_URL=http://<host>:8000/api/v1`.

Demo users (non-production only) use the password from `DEMO_PASSWORD` (default `demo1234`).

## Deploying on AWS (plan)

Laravel on ECS Fargate or Elastic Beanstalk behind an ALB, RDS for MySQL or MariaDB, secrets in AWS Secrets Manager (never in the image), S3 + CloudFront for photos, SES for email, all in `ap-southeast-1` (Singapore). A scheduled `schedule:run` marks no-shows and sends reminders.

## Not built yet

Staff board, staff check-in and walk-in endpoints (the app's mock already defines their contract), member geo check-in, push notifications and payments.

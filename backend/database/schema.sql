-- FlexiSpace database schema
-- Target: MySQL 8.0.16+ or MariaDB 10.11+ (InnoDB, utf8mb4). Mirrors the API
-- contract in docs/openapi.json. The Laravel 12 migrations will be generated
-- from this design; this file is the reviewable reference.
--
-- Conventions
--   * Every instant is stored in UTC (DATETIME(3), app/DB session time_zone = '+00:00').
--     Local times are derived from locations.timezone (IANA) at the edge, never stored.
--   * Money is BIGINT minor units + CHAR(3) ISO 4217 currency. No DECIMAL/FLOAT for prices.
--   * Public ids are ULIDs (CHAR(26)) so they are not guessable; tables still use them as PKs.
--   * Enumerations use VARCHAR + CHECK (portable across MySQL and MariaDB, easy to extend).

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

CREATE TABLE brands (
  id              VARCHAR(32)   NOT NULL,             -- 'tcg', 'hive', 'clustered'
  name            VARCHAR(120)  NOT NULL,
  tagline         VARCHAR(255)  NOT NULL DEFAULT '',
  theme_primary       CHAR(7)   NOT NULL,             -- '#2F6B4F'
  theme_on_primary    CHAR(7)   NOT NULL,
  theme_primary_soft  CHAR(7)   NOT NULL,
  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE countries (
  code              CHAR(2)      NOT NULL,             -- ISO 3166-1 alpha-2
  name              VARCHAR(80)  NOT NULL,
  currency          CHAR(3)      NOT NULL,             -- ISO 4217
  currency_exponent TINYINT UNSIGNED NOT NULL,         -- 2 for MYR, 0 for VND
  tax_label         VARCHAR(16)  NULL,                 -- 'SST', 'GST', 'VAT'; NULL = none
  tax_rate_bp       SMALLINT UNSIGNED NOT NULL DEFAULT 0, -- basis points: 800 = 8%
  PRIMARY KEY (code),
  CONSTRAINT chk_countries_exponent CHECK (currency_exponent <= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
  id                   CHAR(26)      NOT NULL,
  brand_id             VARCHAR(32)   NOT NULL,
  country_code         CHAR(2)       NOT NULL,
  city                 VARCHAR(80)   NOT NULL,
  name                 VARCHAR(120)  NOT NULL,
  address              VARCHAR(255)  NOT NULL,
  lat                  DECIMAL(9,6)  NOT NULL,
  lng                  DECIMAL(9,6)  NOT NULL,
  timezone             VARCHAR(64)   NOT NULL,          -- IANA, e.g. 'Australia/Sydney'
  same_day_radius_km   DECIMAL(6,2)  NOT NULL DEFAULT 30.00,
  check_in_radius_m    SMALLINT UNSIGNED NOT NULL DEFAULT 200,
  is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_locations_country_brand (country_code, brand_id),
  CONSTRAINT fk_locations_brand   FOREIGN KEY (brand_id)     REFERENCES brands (id),
  CONSTRAINT fk_locations_country FOREIGN KEY (country_code) REFERENCES countries (code),
  CONSTRAINT chk_locations_lat CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT chk_locations_lng CHECK (lng BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wall-clock hours in the location's own timezone. No row for a weekday = closed.
CREATE TABLE location_opening_hours (
  location_id  CHAR(26)          NOT NULL,
  weekday      TINYINT UNSIGNED  NOT NULL,              -- 0 = Monday … 6 = Sunday
  opens        TIME              NOT NULL,
  closes       TIME              NOT NULL,
  PRIMARY KEY (location_id, weekday),
  CONSTRAINT fk_hours_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE,
  CONSTRAINT chk_hours_weekday CHECK (weekday <= 6),
  CONSTRAINT chk_hours_range   CHECK (opens < closes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE location_amenities (
  location_id  CHAR(26)     NOT NULL,
  amenity      VARCHAR(60)  NOT NULL,
  PRIMARY KEY (location_id, amenity),
  CONSTRAINT fk_amenities_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE spaces (
  id                 CHAR(26)          NOT NULL,
  location_id        CHAR(26)          NOT NULL,
  type               VARCHAR(20)       NOT NULL,
  name               VARCHAR(120)      NOT NULL,
  capacity           SMALLINT UNSIGNED NOT NULL,
  seats              SMALLINT UNSIGNED NOT NULL DEFAULT 1, -- shared pools (hot desks): seats sold per day
  rate_unit          VARCHAR(8)        NOT NULL,
  rate_amount_minor  BIGINT UNSIGNED   NOT NULL,
  rate_currency      CHAR(3)           NOT NULL,
  is_bookable_online BOOLEAN           NOT NULL DEFAULT TRUE,  -- private offices: false
  is_active          BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at         DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_spaces_location (location_id),
  CONSTRAINT fk_spaces_location FOREIGN KEY (location_id) REFERENCES locations (id),
  CONSTRAINT chk_spaces_type CHECK (type IN ('hot_desk', 'meeting_room', 'private_office', 'event_space')),
  CONSTRAINT chk_spaces_unit CHECK (rate_unit IN ('hour', 'day', 'month')),
  CONSTRAINT chk_spaces_capacity CHECK (capacity > 0 AND seats > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- People and access (roles decide what; assignments decide where)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id                 CHAR(26)      NOT NULL,
  name               VARCHAR(120)  NOT NULL,
  email              VARCHAR(191)  NOT NULL,
  phone              VARCHAR(32)   NULL,
  password           VARCHAR(255)  NOT NULL,             -- bcrypt/argon2 hash (Laravel Hash)
  role               VARCHAR(16)   NOT NULL DEFAULT 'member',
  no_show_strikes    TINYINT UNSIGNED NOT NULL DEFAULT 0, -- anti-abuse: suspend booking after N
  email_verified_at  DATETIME(3)   NULL,
  remember_token     VARCHAR(100)  NULL,
  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_role CHECK (role IN ('member', 'staff', 'brand_admin', 'group_admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A staff member's scope. location_id NULL = every location of the brand.
-- Enforced by a Laravel global scope + policies on every staff query.
CREATE TABLE staff_assignments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      CHAR(26)     NOT NULL,
  brand_id     VARCHAR(32)  NOT NULL,
  location_id  CHAR(26)     NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_assignment (user_id, brand_id, location_id),
  KEY idx_assignment_brand (brand_id),
  CONSTRAINT fk_assign_user     FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_brand    FOREIGN KEY (brand_id)    REFERENCES brands (id),
  CONSTRAINT fk_assign_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Laravel Sanctum tokens (shape of the framework's own migration).
CREATE TABLE personal_access_tokens (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tokenable_type  VARCHAR(255)  NOT NULL,
  tokenable_id    CHAR(26)      NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  token           CHAR(64)      NOT NULL,                -- SHA-256 of the plain token
  abilities       TEXT          NULL,
  last_used_at    DATETIME(3)   NULL,
  expires_at      DATETIME(3)   NULL,
  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pat_token (token),
  KEY idx_pat_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

CREATE TABLE bookings (
  id                  CHAR(26)      NOT NULL,
  code                CHAR(8)       NOT NULL,             -- 'FXB-7QLM', shown to people
  space_id            CHAR(26)      NOT NULL,
  location_id         CHAR(26)      NOT NULL,             -- denormalised for staff-board queries
  user_id             CHAR(26)      NULL,                 -- NULL for walk-in guests
  guest_name          VARCHAR(120)  NULL,
  guest_email         VARCHAR(191)  NULL,
  status              VARCHAR(12)   NOT NULL DEFAULT 'confirmed',
  starts_at           DATETIME(3)   NOT NULL,             -- UTC
  ends_at             DATETIME(3)   NOT NULL,             -- UTC
  subtotal_minor      BIGINT UNSIGNED NOT NULL,
  tax_minor           BIGINT UNSIGNED NOT NULL,
  total_minor         BIGINT UNSIGNED NOT NULL,
  currency            CHAR(3)       NOT NULL,
  tax_label           VARCHAR(16)   NULL,                 -- snapshot at booking time
  tax_rate_bp         SMALLINT UNSIGNED NOT NULL,         -- snapshot at booking time
  qr_token_hash       CHAR(64)      NOT NULL,             -- SHA-256; the plain token only goes to the owner
  -- Anti-fake-booking audit trail: where the phone said it was when booking.
  booked_lat          DECIMAL(9,6)  NULL,
  booked_lng          DECIMAL(9,6)  NULL,
  booked_distance_km  DECIMAL(8,2)  NULL,
  booked_mocked_gps   BOOLEAN       NOT NULL DEFAULT FALSE,
  checked_in_at       DATETIME(3)   NULL,
  checked_in_by       CHAR(26)      NULL,                 -- staff user for desk/QR check-ins
  check_in_method     VARCHAR(8)    NULL,
  cancelled_at        DATETIME(3)   NULL,
  created_by          CHAR(26)      NULL,                 -- staff user for walk-ins
  created_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_code (code),
  -- Availability and overlap checks: bookings of a space around a time range.
  KEY idx_bookings_space_time (space_id, starts_at, ends_at),
  -- Staff board: a location's bookings for a day.
  KEY idx_bookings_location_time (location_id, starts_at),
  -- "My bookings" and the active-bookings cap.
  KEY idx_bookings_user_time (user_id, starts_at),
  -- No-show sweeper: confirmed bookings whose grace period has passed.
  KEY idx_bookings_status_time (status, starts_at),
  CONSTRAINT fk_bookings_space    FOREIGN KEY (space_id)      REFERENCES spaces (id),
  CONSTRAINT fk_bookings_location FOREIGN KEY (location_id)   REFERENCES locations (id),
  CONSTRAINT fk_bookings_user     FOREIGN KEY (user_id)       REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_checkin  FOREIGN KEY (checked_in_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_creator  FOREIGN KEY (created_by)    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_bookings_status  CHECK (status IN ('confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT chk_bookings_method  CHECK (check_in_method IS NULL OR check_in_method IN ('geo', 'qr', 'code', 'walk_in')),
  CONSTRAINT chk_bookings_range   CHECK (starts_at < ends_at),
  CONSTRAINT chk_bookings_total   CHECK (total_minor = subtotal_minor + tax_minor),
  CONSTRAINT chk_bookings_owner   CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Double-booking prevention. MySQL/MariaDB have no exclusion constraints, so the
-- API creates a booking inside one transaction:
--   1. SELECT id FROM spaces WHERE id = ? FOR UPDATE;          -- serialise per space
--   2. SELECT COUNT(*) FROM bookings
--        WHERE space_id = ? AND status IN ('confirmed', 'checked_in')
--          AND starts_at < :ends_at AND ends_at > :starts_at;  -- uses idx_bookings_space_time
--   3. INSERT only if the count is below spaces.seats; else respond 422.
-- The same transaction re-runs the distance rule on the submitted coordinates.

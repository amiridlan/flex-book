<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Country;
use App\Models\Location;
use App\Models\Space;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * Loads the same fictional data the app's mock server uses, from JSON exported
 * by `npm run seed:export` (see src/api/__tests__/seed-fixtures.test.ts).
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->seedCatalog();
            // Demo accounts share one password: never create them in production.
            if (! app()->isProduction()) {
                $this->seedUsers();
            }
        });
    }

    private function seedCatalog(): void
    {
        foreach ($this->fixture('brands') as $brand) {
            Brand::query()->updateOrCreate(['id' => $brand['id']], [
                'name' => $brand['name'],
                'tagline' => $brand['tagline'],
                'theme_primary' => $brand['theme']['primary'],
                'theme_on_primary' => $brand['theme']['onPrimary'],
                'theme_primary_soft' => $brand['theme']['primarySoft'],
            ]);
        }

        foreach ($this->fixture('countries') as $country) {
            Country::query()->updateOrCreate(['code' => $country['code']], [
                'name' => $country['name'],
                'currency' => $country['currency'],
                'currency_exponent' => $country['currencyExponent'],
                'tax_label' => $country['tax']['label'],
                'tax_rate_bp' => $country['tax']['rateBp'],
            ]);
        }

        foreach ($this->fixture('locations') as $row) {
            $location = Location::query()->updateOrCreate(['id' => $row['id']], [
                'brand_id' => $row['brandId'],
                'country_code' => $row['countryCode'],
                'city' => $row['city'],
                'name' => $row['name'],
                'address' => $row['address'],
                'lat' => $row['lat'],
                'lng' => $row['lng'],
                'timezone' => $row['timezone'],
                'same_day_radius_km' => $row['bookingRules']['sameDayRadiusKm'],
                'check_in_radius_m' => $row['bookingRules']['checkInRadiusM'],
            ]);

            $location->openingHours()->delete();
            foreach ($row['openingHours'] as $weekday => $hours) {
                if ($hours !== null) {
                    $location->openingHours()->create(['weekday' => $weekday, ...$hours]);
                }
            }

            $location->amenities()->delete();
            foreach ($row['amenities'] as $amenity) {
                $location->amenities()->create(['amenity' => $amenity]);
            }
        }

        foreach ($this->fixture('spaces') as $row) {
            Space::query()->updateOrCreate(['id' => $row['id']], [
                'location_id' => $row['locationId'],
                'type' => $row['type'],
                'name' => $row['name'],
                'capacity' => $row['capacity'],
                'seats' => $row['type'] === 'hot_desk' ? 12 : 1,
                'amenities' => $row['amenities'],
                'rate_unit' => $row['rate']['unit'],
                'rate_amount_minor' => $row['rate']['price']['amountMinor'],
                'rate_currency' => $row['rate']['price']['currency'],
                'is_bookable_online' => $row['type'] !== 'private_office',
            ]);
        }
    }

    private function seedUsers(): void
    {
        $password = Hash::make((string) env('DEMO_PASSWORD', 'demo1234'));

        foreach ($this->fixture('users') as $row) {
            $user = User::query()->updateOrCreate(['id' => $row['id']], [
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'password' => $password,
            ]);

            $user->assignments()->delete();
            foreach ($row['assignments'] as $assignment) {
                $user->assignments()->create([
                    'brand_id' => $assignment['brandId'],
                    'location_id' => $assignment['locationId'],
                ]);
            }
        }
    }

    /** @return list<array<string, mixed>> */
    private function fixture(string $name): array
    {
        $path = database_path("seeders/data/{$name}.json");
        $data = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($data)) {
            throw new RuntimeException("Fixture {$name}.json is not a list.");
        }

        return $data;
    }
}

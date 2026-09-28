<?php

namespace Tests\Feature\Api;

class LocationScopeTest extends ApiTestCase
{
    public function test_members_see_all_eighteen_locations_in_the_app_contract_shape(): void
    {
        $this->actingAsDemo('aisyah@example.com');

        $this->getJson('/api/v1/locations')
            ->assertOk()
            ->assertJsonPath('meta.total', 18)
            ->assertJsonStructure([
                'data' => [['id', 'brandId', 'countryCode', 'city', 'name', 'address', 'lat', 'lng',
                    'timezone', 'openingHours', 'amenities', 'bookingRules' => ['sameDayRadiusKm', 'checkInRadiusM']]],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_brand_staff_only_see_their_brand(): void
    {
        $this->actingAsDemo('daniel.hive@example.com');

        $brands = collect($this->getJson('/api/v1/locations')->assertOk()->json('data'))->pluck('brandId');

        $this->assertCount(6, $brands);
        $this->assertSame(['hive'], $brands->unique()->values()->all());
    }

    public function test_location_staff_only_see_their_location(): void
    {
        $this->actingAsDemo('priya.tcg@example.com');

        $this->getJson('/api/v1/locations')->assertOk()->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', 'loc_tcg_kul');
    }

    public function test_out_of_scope_locations_are_404_not_403(): void
    {
        $this->actingAsDemo('daniel.hive@example.com');

        $this->getJson('/api/v1/locations/loc_tcg_kul')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Not found.']);
    }

    public function test_filters_and_detail_with_spaces(): void
    {
        $this->actingAsDemo('aisyah@example.com');

        $this->getJson('/api/v1/locations?country=AU&brand=hive')
            ->assertOk()->assertJsonPath('data.0.city', 'Melbourne')->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/locations/loc_hive_han')
            ->assertOk()
            ->assertJsonPath('data.timezone', 'Asia/Ho_Chi_Minh')
            ->assertJsonCount(4, 'data.spaces')
            ->assertJsonPath('data.spaces.0.rate.price.currency', 'VND')
            ->assertJsonPath('data.openingHours.0', ['opens' => '07:00', 'closes' => '22:00']);
    }
}

<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Carbon;

class AvailabilityTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-01T00:00:00Z');
        $this->actingAsDemo('aisyah@example.com');
    }

    public function test_slots_follow_sydney_daylight_saving(): void
    {
        $before = $this->getJson('/api/v1/spaces/loc_tcg_syd__room-s/availability?date=2026-10-02')->assertOk();
        $after = $this->getJson('/api/v1/spaces/loc_tcg_syd__room-s/availability?date=2026-10-05')->assertOk();

        // 8:00 AM local both days: UTC+10 before 04/10/2026, UTC+11 after.
        $before->assertJsonPath('data.slots.0.startsAt', '2026-10-01T22:00:00.000Z')->assertJsonCount(12, 'data.slots');
        $after->assertJsonPath('data.slots.0.startsAt', '2026-10-04T21:00:00.000Z');
    }

    public function test_closed_days_and_private_offices(): void
    {
        $this->getJson('/api/v1/spaces/loc_tcg_syd__room-s/availability?date=2026-10-04')
            ->assertOk()->assertJsonPath('data.open', false)->assertJsonPath('data.slots', []);

        $this->getJson('/api/v1/spaces/loc_clustered_bne__office/availability?date=2026-10-01')
            ->assertOk()->assertJsonPath('data.bookable', false);
    }

    public function test_the_date_must_be_a_local_calendar_day(): void
    {
        $this->getJson('/api/v1/spaces/loc_tcg_syd__room-s/availability?date=05/10/2026')
            ->assertUnprocessable()->assertJsonValidationErrors('date');
    }
}

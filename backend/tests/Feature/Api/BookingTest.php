<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Carbon;

class BookingTest extends ApiTestCase
{
    private const SPACE = 'loc_tcg_kul__room-s';

    private const KL = ['lat' => 3.1528, 'lng' => 101.7038, 'mocked' => false];

    private const SYDNEY = ['lat' => -33.8688, 'lng' => 151.2093, 'mocked' => false];

    protected function setUp(): void
    {
        parent::setUp();
        // Tuesday 29/09/2026, 10:00 AM in Kuala Lumpur.
        Carbon::setTestNow('2026-09-29T02:00:00Z');
    }

    /** Tomorrow 2:00–3:00 PM in Kuala Lumpur, in UTC. */
    private function slot(): array
    {
        return ['startsAt' => '2026-09-30T06:00:00.000Z', 'endsAt' => '2026-09-30T07:00:00.000Z'];
    }

    public function test_a_member_books_with_tax_and_gets_a_qr_token(): void
    {
        $this->actingAsDemo('aisyah@example.com');

        $this->postJson('/api/v1/bookings', ['spaceId' => self::SPACE, ...$this->slot(), 'device' => self::KL])
            ->assertCreated()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.price.subtotal', ['amountMinor' => 6000, 'currency' => 'MYR'])
            ->assertJsonPath('data.price.tax.amountMinor', 480)
            ->assertJsonPath('data.price.total.amountMinor', 6480)
            ->assertJsonPath('data.price.taxLabel', 'SST')
            ->assertJsonPath('data.location.timezone', 'Asia/Kuala_Lumpur')
            ->assertJson(fn ($json) => $json->where('data.code', fn (string $code) => (bool) preg_match('/^FXB-[A-Z2-9]{4}$/', $code))
                ->where('data.qrToken', fn (?string $token) => str_starts_with((string) $token, 'qr_'))
                ->etc());
    }

    public function test_the_server_re_checks_the_distance_rule(): void
    {
        $this->actingAsDemo('aisyah@example.com');

        $this->postJson('/api/v1/bookings', ['spaceId' => self::SPACE, ...$this->slot(), 'device' => self::SYDNEY])
            ->assertUnprocessable()
            ->assertJsonPath('errors.location.0', fn (string $m) => str_contains($m, 'from within Malaysia'));

        $this->postJson('/api/v1/bookings', ['spaceId' => self::SPACE, ...$this->slot(), 'device' => [...self::KL, 'mocked' => true]])
            ->assertUnprocessable()->assertJsonValidationErrors('location');

        $this->postJson('/api/v1/bookings', ['spaceId' => self::SPACE, ...$this->slot(), 'device' => null])
            ->assertUnprocessable()->assertJsonValidationErrors('location');
    }

    public function test_a_slot_cannot_be_booked_twice_and_availability_reflects_it(): void
    {
        $this->actingAsDemo('aisyah@example.com');
        $body = ['spaceId' => self::SPACE, ...$this->slot(), 'device' => self::KL];

        $this->postJson('/api/v1/bookings', $body)->assertCreated();
        $this->postJson('/api/v1/bookings', $body)
            ->assertUnprocessable()->assertJsonValidationErrors('startsAt');

        $slots = collect($this->getJson('/api/v1/spaces/'.self::SPACE.'/availability?date=2026-09-30')->json('data.slots'));
        $this->assertFalse($slots->firstWhere('startsAt', $this->slot()['startsAt'])['available']);
    }

    public function test_staff_cannot_create_member_bookings(): void
    {
        $this->actingAsDemo('daniel.hive@example.com');

        $this->postJson('/api/v1/bookings', ['spaceId' => self::SPACE, ...$this->slot(), 'device' => self::KL])
            ->assertForbidden();
    }

    public function test_members_only_see_and_cancel_their_own_bookings(): void
    {
        $this->actingAsDemo('aisyah@example.com');
        $id = $this->postJson('/api/v1/bookings', ['spaceId' => self::SPACE, ...$this->slot(), 'device' => self::KL])
            ->json('data.id');

        $this->getJson('/api/v1/bookings')->assertOk()->assertJsonCount(1, 'data');

        $this->patchJson("/api/v1/bookings/{$id}", ['status' => 'cancelled'])
            ->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->actingAsDemo('minh.clustered@example.com');
        $this->getJson("/api/v1/bookings/{$id}")->assertNotFound();
    }
}

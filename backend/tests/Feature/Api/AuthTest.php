<?php

namespace Tests\Feature\Api;

class AuthTest extends ApiTestCase
{
    public function test_login_returns_a_token_and_the_user_with_permissions(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'daniel.hive@example.com',
            'password' => 'demo1234',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.role', 'staff')
            ->assertJsonPath('data.user.assignments.0', ['brandId' => 'hive', 'locationId' => null])
            ->assertJsonFragment(['permissions' => [
                'locations.view', 'staff.dashboard', 'bookings.view_location',
                'bookings.check_in', 'bookings.walk_in', 'spaces.block',
            ]]);
        $this->assertNotEmpty($response->json('data.token'));

        $this->withToken($response->json('data.token'))
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'daniel.hive@example.com');
    }

    public function test_wrong_credentials_get_a_laravel_422_without_revealing_which_part_was_wrong(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'aisyah@example.com', 'password' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'These credentials do not match our records.']);
    }

    public function test_protected_routes_need_a_token(): void
    {
        $this->getJson('/api/v1/locations')->assertUnauthorized();
    }
}

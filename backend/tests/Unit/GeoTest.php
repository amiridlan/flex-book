<?php

namespace Tests\Unit;

use App\Domain\Geo;
use PHPUnit\Framework\TestCase;

/** Parity with the app's src/domain/__tests__/booking-rules.test.ts geo cases. */
class GeoTest extends TestCase
{
    public function test_it_measures_great_circle_distance(): void
    {
        $this->assertSame(0.0, Geo::distanceKm(3.1528, 101.7038, 3.1528, 101.7038));
        $this->assertGreaterThan(6500, Geo::distanceKm(3.1528, 101.7038, -33.8688, 151.2093));
    }

    public function test_it_resolves_markets_preferring_singapore_over_malaysia(): void
    {
        $this->assertSame('MY', Geo::marketAt(3.1528, 101.7038));
        $this->assertSame('SG', Geo::marketAt(1.2834, 103.8607));
        $this->assertSame('VN', Geo::marketAt(21.0285, 105.8542));
        $this->assertSame('AU', Geo::marketAt(-33.8688, 151.2093));
        $this->assertNull(Geo::marketAt(51.5, -0.12));
    }

    public function test_it_formats_distances_like_the_app(): void
    {
        $this->assertSame('450 m', Geo::formatDistance(0.45));
        $this->assertSame('4.4 km', Geo::formatDistance(4.42));
        $this->assertSame('6,616 km', Geo::formatDistance(6616.3));
    }
}

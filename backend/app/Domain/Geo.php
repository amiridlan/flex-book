<?php

namespace App\Domain;

/** Mirror of src/domain/geo.ts in the app. */
final class Geo
{
    private const EARTH_RADIUS_KM = 6371.0;

    public static function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $h = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * self::EARTH_RADIUS_KM * asin(min(1.0, sqrt($h)));
    }

    /**
     * DEMO APPROXIMATION: bounding boxes for the six markets, smallest first so
     * Singapore wins over Malaysia. Production swaps this for a reverse-geocoding
     * call (e.g. AWS Location Service) behind the same method.
     */
    private const MARKET_BOXES = [
        'SG' => [[1.15, 1.48, 103.59, 104.1]],
        'HK' => [[22.13, 22.57, 113.82, 114.45]],
        'MY' => [[0.85, 7.4, 99.6, 104.6], [0.85, 7.4, 109.5, 119.3]],
        'TH' => [[5.6, 20.5, 97.3, 105.7]],
        'VN' => [[8.4, 23.4, 102.1, 109.5]],
        'AU' => [[-44.0, -10.0, 112.0, 154.0]],
    ];

    public static function marketAt(float $lat, float $lng): ?string
    {
        foreach (self::MARKET_BOXES as $code => $boxes) {
            foreach ($boxes as [$minLat, $maxLat, $minLng, $maxLng]) {
                if ($lat >= $minLat && $lat <= $maxLat && $lng >= $minLng && $lng <= $maxLng) {
                    return $code;
                }
            }
        }

        return null;
    }

    public static function formatDistance(float $km): string
    {
        if ($km < 1) {
            return round($km * 1000).' m';
        }

        return $km < 100 ? number_format($km, 1).' km' : number_format($km).' km';
    }
}

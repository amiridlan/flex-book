<?php

namespace App\Http\Resources;

use App\Models\Location;
use App\Models\OpeningHour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Location */
class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $byWeekday = $this->openingHours->keyBy('weekday');

        return [
            'id' => $this->id,
            'brandId' => $this->brand_id,
            'countryCode' => $this->country_code,
            'city' => $this->city,
            'name' => $this->name,
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'timezone' => $this->timezone,
            // Seven entries, Monday first, wall-clock HH:MM in the location's zone; null = closed.
            'openingHours' => array_map(function (int $day) use ($byWeekday) {
                /** @var OpeningHour|null $hours */
                $hours = $byWeekday->get($day);

                return $hours ? ['opens' => substr($hours->opens, 0, 5), 'closes' => substr($hours->closes, 0, 5)] : null;
            }, range(0, 6)),
            'amenities' => $this->amenities->pluck('amenity')->values(),
            'bookingRules' => [
                'sameDayRadiusKm' => $this->same_day_radius_km,
                'checkInRadiusM' => $this->check_in_radius_m,
            ],
            'spaces' => SpaceResource::collection($this->whenLoaded('spaces')),
        ];
    }
}

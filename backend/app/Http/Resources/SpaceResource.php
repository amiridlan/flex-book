<?php

namespace App\Http\Resources;

use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Space */
class SpaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'locationId' => $this->location_id,
            'type' => $this->type->value,
            'name' => $this->name,
            'capacity' => $this->capacity,
            'amenities' => $this->amenities,
            'rate' => [
                'unit' => $this->rate_unit->value,
                'price' => ['amountMinor' => $this->rate_amount_minor, 'currency' => $this->rate_currency],
            ],
        ];
    }
}

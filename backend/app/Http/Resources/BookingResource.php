<?php

namespace App\Http\Resources;

use App\Models\Booking;
use App\Support\Iso;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Booking */
class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isOwner = $request->user()?->id === $this->user_id;
        $money = fn (int $amount) => ['amountMinor' => $amount, 'currency' => $this->currency];

        return [
            'id' => $this->id,
            'code' => $this->code,
            'status' => $this->effectiveStatus(CarbonImmutable::now())->value,
            'startsAt' => Iso::utc($this->starts_at),
            'endsAt' => Iso::utc($this->ends_at),
            'createdAt' => Iso::utc($this->created_at),
            'checkedInAt' => Iso::utc($this->checked_in_at),
            // Only the owner gets the QR token; staff views never include it.
            'qrToken' => $isOwner ? $this->qrToken() : null,
            'price' => [
                'subtotal' => $money($this->subtotal_minor),
                'tax' => $money($this->tax_minor),
                'total' => $money($this->total_minor),
                'taxLabel' => $this->tax_label,
                'taxRateBp' => $this->tax_rate_bp,
            ],
            'space' => ['id' => $this->space->id, 'name' => $this->space->name, 'type' => $this->space->type->value],
            'location' => [
                'id' => $this->location->id,
                'name' => $this->location->name,
                'city' => $this->location->city,
                'timezone' => $this->location->timezone,
                'brandId' => $this->location->brand_id,
                'countryCode' => $this->location->country_code,
            ],
        ];
    }
}

<?php

namespace App\Models;

use App\Enums\RateUnit;
use App\Enums\SpaceType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Space extends Model
{
    use HasUlids;

    protected $fillable = [
        'id', 'location_id', 'type', 'name', 'capacity', 'seats', 'amenities',
        'rate_unit', 'rate_amount_minor', 'rate_currency', 'is_bookable_online', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => SpaceType::class,
            'rate_unit' => RateUnit::class,
            'amenities' => 'array',
            'capacity' => 'integer',
            'seats' => 'integer',
            'rate_amount_minor' => 'integer',
            'is_bookable_online' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Location, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasUlids;

    protected $fillable = [
        'id', 'brand_id', 'country_code', 'city', 'name', 'address', 'lat', 'lng',
        'timezone', 'same_day_radius_km', 'check_in_radius_m', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'same_day_radius_km' => 'float',
            'check_in_radius_m' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return BelongsTo<Country, $this> */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_code', 'code');
    }

    /** @return HasMany<OpeningHour, $this> */
    public function openingHours(): HasMany
    {
        return $this->hasMany(OpeningHour::class);
    }

    /** @return HasMany<LocationAmenity, $this> */
    public function amenities(): HasMany
    {
        return $this->hasMany(LocationAmenity::class);
    }

    /** @return HasMany<Space, $this> */
    public function spaces(): HasMany
    {
        return $this->hasMany(Space::class);
    }

    /**
     * Staff scope as a query: members and group admins see everything, staff
     * and brand admins only their assigned brands/locations. Every location
     * query for a signed-in user goes through this.
     *
     * @param  Builder<Location>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->role->seesAllLocations()) {
            return;
        }

        $query->whereExists(function ($sub) use ($user) {
            $sub->selectRaw('1')
                ->from('staff_assignments')
                ->where('staff_assignments.user_id', $user->id)
                ->whereColumn('staff_assignments.brand_id', 'locations.brand_id')
                ->where(fn ($q) => $q
                    ->whereNull('staff_assignments.location_id')
                    ->orWhereColumn('staff_assignments.location_id', 'locations.id'));
        });
    }
}

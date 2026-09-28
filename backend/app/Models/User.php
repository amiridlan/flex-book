<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUlids, Notifiable;

    protected $fillable = ['id', 'name', 'email', 'phone', 'password', 'role'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    /** @return HasMany<StaffAssignment, $this> */
    public function assignments(): HasMany
    {
        return $this->hasMany(StaffAssignment::class);
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->role->permissions(), true);
    }

    /** The same rule as the mock server's canSeeLocation(). */
    public function canSeeLocation(Location $location): bool
    {
        if ($this->role->seesAllLocations()) {
            return true;
        }

        return $this->assignments->contains(
            fn (StaffAssignment $a) => $a->brand_id === $location->brand_id
                && ($a->location_id === null || $a->location_id === $location->id),
        );
    }
}

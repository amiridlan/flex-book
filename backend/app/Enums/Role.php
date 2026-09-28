<?php

namespace App\Enums;

enum Role: string
{
    case Member = 'member';
    case Staff = 'staff';
    case BrandAdmin = 'brand_admin';
    case GroupAdmin = 'group_admin';

    /**
     * Permissions are derived from the role, never stored per user, so the app
     * checks capabilities ("bookings.check_in") rather than role names.
     *
     * @return list<string>
     */
    public function permissions(): array
    {
        $staff = [
            'locations.view', 'staff.dashboard', 'bookings.view_location',
            'bookings.check_in', 'bookings.walk_in', 'spaces.block',
        ];
        $brandAdmin = [...$staff, 'spaces.manage', 'reports.view'];

        return match ($this) {
            self::Member => ['locations.view', 'bookings.create', 'bookings.view_own'],
            self::Staff => $staff,
            self::BrandAdmin => $brandAdmin,
            self::GroupAdmin => [...$brandAdmin, 'brands.manage'],
        };
    }

    /** Members and group admins see every location; others only their assignments. */
    public function seesAllLocations(): bool
    {
        return $this === self::Member || $this === self::GroupAdmin;
    }
}

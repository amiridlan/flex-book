<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use HasUlids;

    protected $fillable = [
        'code', 'space_id', 'location_id', 'user_id', 'guest_name', 'guest_email', 'status',
        'starts_at', 'ends_at', 'subtotal_minor', 'tax_minor', 'total_minor', 'currency',
        'tax_label', 'tax_rate_bp', 'booked_lat', 'booked_lng',
        'booked_distance_km', 'booked_mocked_gps', 'checked_in_at', 'checked_in_by',
        'check_in_method', 'cancelled_at',
    ];

    /**
     * The check-in QR token: an HMAC of the booking id with the app key. Nothing
     * secret is stored; the owner can always re-derive it, staff scanners verify
     * it, and it cannot be forged without the server key.
     */
    public function qrToken(): string
    {
        $key = (string) config('app.key');

        return 'qr_'.substr(hash_hmac('sha256', 'check-in|'.$this->id, $key), 0, 32);
    }

    /** Status as of now: unclaimed bookings become no-shows after the grace period. */
    public function effectiveStatus(\DateTimeInterface $now): BookingStatus
    {
        $graceEnds = $this->starts_at->addMinutes(self::NO_SHOW_GRACE_MIN);
        if ($this->status === BookingStatus::Confirmed && $now > $graceEnds) {
            return BookingStatus::NoShow;
        }
        if ($this->status === BookingStatus::CheckedIn && $now >= $this->ends_at) {
            return BookingStatus::Completed;
        }

        return $this->status;
    }

    public const NO_SHOW_GRACE_MIN = 15;

    public const CANCELLATION_CUTOFF_MIN = 60;

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'checked_in_at' => 'immutable_datetime',
            'cancelled_at' => 'immutable_datetime',
            'subtotal_minor' => 'integer',
            'tax_minor' => 'integer',
            'total_minor' => 'integer',
            'tax_rate_bp' => 'integer',
            'booked_mocked_gps' => 'boolean',
        ];
    }

    /** @return BelongsTo<Space, $this> */
    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    /** @return BelongsTo<Location, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Bookings that hold the space during [start, end).
     *
     * @param  Builder<Booking>  $query
     */
    public function scopeOverlapping(Builder $query, string $spaceId, \DateTimeInterface $start, \DateTimeInterface $end): void
    {
        $query->where('space_id', $spaceId)
            ->whereIn('status', BookingStatus::holding())
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start);
    }
}

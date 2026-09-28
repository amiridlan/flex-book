<?php

namespace App\Http\Requests;

use App\Domain\DeviceFix;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasPermission('bookings.create');
    }

    public function rules(): array
    {
        return [
            'spaceId' => ['required', 'string', 'max:40'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            // Null when the member has not shared location; the rule then rejects the booking.
            'device' => ['present', 'nullable', 'array'],
            'device.lat' => ['required_with:device', 'numeric', 'between:-90,90'],
            'device.lng' => ['required_with:device', 'numeric', 'between:-180,180'],
            'device.mocked' => ['required_with:device', 'boolean'],
        ];
    }

    public function startsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->string('startsAt')->toString())->utc();
    }

    public function endsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->string('endsAt')->toString())->utc();
    }

    public function device(): ?DeviceFix
    {
        /** @var array{lat: float, lng: float, mocked: bool}|null $device */
        $device = $this->validated('device');

        return DeviceFix::fromArray($device);
    }
}

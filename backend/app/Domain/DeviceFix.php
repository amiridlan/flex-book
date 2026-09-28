<?php

namespace App\Domain;

/** Where the phone said it was. `mocked` is Android's mock-location flag. */
final readonly class DeviceFix
{
    public function __construct(
        public float $lat,
        public float $lng,
        public bool $mocked,
    ) {}

    /** @param array{lat: float|int, lng: float|int, mocked: bool}|null $input */
    public static function fromArray(?array $input): ?self
    {
        return $input === null
            ? null
            : new self((float) $input['lat'], (float) $input['lng'], (bool) $input['mocked']);
    }
}

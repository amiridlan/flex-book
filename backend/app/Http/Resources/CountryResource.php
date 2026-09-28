<?php

namespace App\Http\Resources;

use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Country */
class CountryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'currency' => $this->currency,
            'currencyExponent' => $this->currency_exponent,
            'tax' => ['label' => $this->tax_label, 'rateBp' => $this->tax_rate_bp],
        ];
    }
}

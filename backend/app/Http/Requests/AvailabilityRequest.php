<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AvailabilityRequest extends FormRequest
{
    public function rules(): array
    {
        // A calendar day in the location's timezone, not the server's.
        return ['date' => ['required', 'date_format:Y-m-d']];
    }
}

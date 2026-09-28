<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Wall-clock hours in the location's timezone. Weekday 0 = Monday. */
class OpeningHour extends Model
{
    public $timestamps = false;

    protected $table = 'location_opening_hours';

    protected $fillable = ['location_id', 'weekday', 'opens', 'closes'];

    protected function casts(): array
    {
        return ['weekday' => 'integer'];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationAmenity extends Model
{
    public $timestamps = false;

    protected $fillable = ['location_id', 'amenity'];
}

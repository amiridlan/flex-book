<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffAssignment extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'brand_id', 'location_id'];
}

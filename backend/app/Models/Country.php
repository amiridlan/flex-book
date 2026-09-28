<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    protected $fillable = ['code', 'name', 'currency', 'currency_exponent', 'tax_label', 'tax_rate_bp'];

    protected function casts(): array
    {
        return ['currency_exponent' => 'integer', 'tax_rate_bp' => 'integer'];
    }
}

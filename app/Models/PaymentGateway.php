<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGateway extends Model
{
    protected $fillable = [
        'name',
        'client_key',
        'server_key',
        'merchant_id',
        'is_production',
        'is_active',
    ];

    protected $casts = [
        'is_production' => 'boolean',
        'is_active' => 'boolean',
    ];
}

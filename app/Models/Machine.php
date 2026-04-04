<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Machine extends Model
{
    protected $fillable = [
        'name',
        'is_active',
        'payment_required',
        'token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'payment_required' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($machine) {
            $machine->token = Str::random(8);

            // Ensure uniqueness
            while (self::where('token', $machine->token)->exists()) {
                $machine->token = Str::random(8);
            }
        });
    }
}

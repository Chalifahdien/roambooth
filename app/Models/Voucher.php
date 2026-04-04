<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Voucher extends Model
{
    protected $fillable = [
        'code',
        'type',
        'status',
    ];

    /**
     * Relationship to transaction
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Boot function to automatically generate random voucher code
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($voucher) {
            if (empty($voucher->code)) {
                $voucher->code = self::generateUniqueCode();
            }
        });
    }

    /**
     * Generate unique 8 char code
     */
    private static function generateUniqueCode()
    {
        $code = strtoupper(Str::random(8));

        // Check if code already exists
        if (self::where('code', $code)->exists()) {
            return self::generateUniqueCode();
        }

        return $code;
    }
}

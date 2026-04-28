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
        'amount_koran',
        'amount_reguler',
        'amount_flipbook',
        'amount_print_koran',
        'amount_print_reguler',
        'amount_print_flipbook',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'payment_required' => 'boolean',
        'amount_koran' => 'integer',
        'amount_reguler' => 'integer',
        'amount_flipbook' => 'integer',
        'amount_print_koran' => 'integer',
        'amount_print_reguler' => 'integer',
        'amount_print_flipbook' => 'integer',
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

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function templates()
    {
        return $this->hasMany(Template::class);
    }

    public function stickers()
    {
        return $this->hasMany(Sticker::class);
    }

    public function paperSizes()
    {
        return $this->hasMany(PaperSize::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }
}

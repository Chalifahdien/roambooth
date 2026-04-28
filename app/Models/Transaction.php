<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToMachine;

class Transaction extends Model
{
    use BelongsToMachine;
    protected $fillable = [
        'transaction_id',
        'machine_id',
        'amount',
        'payment_type',
        'template_id',
        'voucher_id',
        'status',
        'started_at',
        'expires_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function photos()
    {
        return $this->hasMany(TransactionPhoto::class);
    }

    public function finalImage()
    {
        return $this->hasOne(FinalImage::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }
}

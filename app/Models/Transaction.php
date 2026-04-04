<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_id',
        'machine_id',
        'amount',
        'payment_type',
        'template_id',
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
}

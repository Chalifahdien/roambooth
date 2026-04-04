<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionPhoto extends Model
{
    protected $fillable = [
        'transaction_id',
        'frame_id',
        'photo_path',
        'taken_at',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function frame()
    {
        return $this->belongsTo(TemplateFrame::class, 'frame_id');
    }
}

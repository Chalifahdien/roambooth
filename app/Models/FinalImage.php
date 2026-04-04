<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinalImage extends Model
{
    protected $fillable = [
        'transaction_id',
        'token',
        'image_path',
        'video_path',
        'amount_print',
        'print_quantity',
        'printed',
    ];

    protected $casts = [
        'printed' => 'boolean',
    ];

    protected $appends = ['image_url', 'video_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function getVideoUrlAttribute(): ?string
    {
        return $this->video_path ? asset('storage/' . $this->video_path) : null;
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

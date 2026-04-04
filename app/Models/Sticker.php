<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sticker extends Model
{
    protected $fillable = [
        'name',
        'category',
        'image_path',
        'is_active',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }
}

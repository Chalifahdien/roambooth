<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToMachine;

class Sticker extends Model
{
    use BelongsToMachine;
    protected $fillable = [
        'machine_id',
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

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }
}

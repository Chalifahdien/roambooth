<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaperSize extends Model
{
    protected $fillable = [
        'name',
        'width_mm',
        'height_mm',
        'is_active',
    ];

    /**
     * Get the templates for the paper size.
     */
    public function templates()
    {
        return $this->hasMany(Template::class);
    }
}

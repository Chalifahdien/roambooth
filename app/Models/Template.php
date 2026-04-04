<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    /** @use HasFactory<\Database\Factories\TemplateFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'category',
        'orientation',
        'template_path',
        'image_width',
        'image_height',
        'frame_count',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'image_width' => 'integer',
        'image_height' => 'integer',
        'frame_count' => 'integer',
    ];

    /**
     * Get the frames for the template.
     */
    public function frames(): HasMany
    {
        return $this->hasMany(TemplateFrame::class);
    }
}

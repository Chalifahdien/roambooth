<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateFrame extends Model
{
    /** @use HasFactory<\Database\Factories\TemplateFrameFactory> */
    use HasFactory;

    protected $fillable = [
        'template_id',
        'frame_order',
        'x',
        'y',
        'width',
        'height',
        'angle',
        'mask_path',
        'shape',
        'path_data',
    ];

    protected $casts = [
        'frame_order' => 'integer',
        'x' => 'integer',
        'y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'angle' => 'integer',
    ];

    /**
     * Get the template that owns the frame.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}

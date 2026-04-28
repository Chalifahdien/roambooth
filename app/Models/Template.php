<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\Traits\BelongsToMachine;

class Template extends Model
{
    /** @use HasFactory<\Database\Factories\TemplateFactory> */
    use HasFactory, BelongsToMachine;

    protected $fillable = [
        'machine_id',
        'paper_size_id',
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
        'paper_size_id' => 'integer',
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

    /**
     * Get the paper size for the template.
     */
    public function paperSize()
    {
        return $this->belongsTo(PaperSize::class);
    }

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }
}

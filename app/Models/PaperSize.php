<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToMachine;

class PaperSize extends Model
{
    use BelongsToMachine;
    protected $fillable = [
        'machine_id',
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

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }
}

<?php

namespace App\Models\Traits;

use App\Models\Scopes\MachineScope;
use Illuminate\Support\Facades\Session;

trait BelongsToMachine
{
    /**
     * Boot the trait.
     */
    protected static function bootBelongsToMachine(): void
    {
        static::addGlobalScope(new MachineScope);

        static::creating(function ($model) {
            if (empty($model->machine_id) && !app()->runningInConsole() && !request()->is('api/*')) {
                $activeMachineId = Session::get('active_machine_id');
                
                if (!$activeMachineId) {
                    $activeMachineId = \App\Models\Machine::first()?->id;
                }

                if ($activeMachineId) {
                    $model->machine_id = $activeMachineId;
                }
            }
        });
    }
}

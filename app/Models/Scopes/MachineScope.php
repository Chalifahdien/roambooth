<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Session;

class MachineScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (app()->runningInConsole() || request()->is('api/*')) {
            return;
        }

        $activeMachineId = Session::get('active_machine_id');

        if (!$activeMachineId) {
            $activeMachineId = \App\Models\Machine::first()?->id;
        }

        if ($activeMachineId) {
            $builder->where($model->getTable() . '.machine_id', $activeMachineId);
        }
    }
}

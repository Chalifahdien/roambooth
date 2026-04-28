<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Machine;

class AssignOldDataToMachine extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:assign-old-data {machine_id? : The ID of the machine to assign the data to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign all existing data (templates, stickers, etc.) that have null machine_id to a specific machine';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $machineId = $this->argument('machine_id');

        if (!$machineId) {
            $machines = Machine::all();
            if ($machines->isEmpty()) {
                $this->error('No machines found in the database. Please create a machine first.');
                return 1;
            }

            $choices = $machines->pluck('name', 'id')->toArray();
            $choiceStrings = [];
            foreach ($choices as $id => $name) {
                $choiceStrings[] = "[$id] $name";
            }

            $machineId = $this->choice(
                'Please select the Machine ID to assign old data to:',
                $choices
            );
            
            // The choice method might return the name or value depending on how it's used. Let's just find the ID.
            $machine = Machine::where('name', $machineId)->first();
            if ($machine) {
                $machineId = $machine->id;
            }
        }

        if (!Machine::find($machineId)) {
            $this->error("Machine with ID {$machineId} not found.");
            return 1;
        }

        $tables = ['templates', 'stickers', 'paper_sizes', 'vouchers', 'transactions'];
        $totalUpdated = 0;

        foreach ($tables as $table) {
            $updated = DB::table($table)
                ->whereNull('machine_id')
                ->update(['machine_id' => $machineId]);
            
            if ($updated > 0) {
                $this->info("Updated {$updated} records in '{$table}' table.");
                $totalUpdated += $updated;
            }
        }

        if ($totalUpdated > 0) {
            $this->info("Successfully assigned {$totalUpdated} old records to machine ID {$machineId}.");
        } else {
            $this->info("No records found with null machine_id. Everything is already assigned!");
        }

        return 0;
    }
}

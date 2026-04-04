<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MachineController extends Controller
{
    /**
     * Display a listing of the machines.
     */
    public function index(): Response
    {
        return Inertia::render('machines/index', [
            'machines' => Machine::latest()->get(),
        ]);
    }

    /**
     * Store a newly created machine in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
            'payment_required' => 'required|boolean',
            'token' => 'nullable|string|max:255',
        ]);

        Machine::create($validated);

        return to_route('machines.index')->with('status', 'machine-created');
    }

    /**
     * Update the specified machine in storage.
     */
    public function update(Request $request, Machine $machine): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
            'payment_required' => 'required|boolean',
            'token' => 'nullable|string|max:255',
        ]);

        $machine->update($validated);

        return to_route('machines.index')->with('status', 'machine-updated');
    }

    /**
     * Remove the specified machine from storage.
     */
    public function destroy(Machine $machine): RedirectResponse
    {
        $machine->delete();

        return to_route('machines.index')->with('status', 'machine-deleted');
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CurrentMachineController extends Controller
{
    /**
     * Update the active machine in the user's session.
     */
    public function store(Request $request)
    {
        $request->validate([
            'machine_id' => 'required|exists:machines,id',
        ]);

        $request->session()->put('active_machine_id', $request->machine_id);

        return back();
    }
}

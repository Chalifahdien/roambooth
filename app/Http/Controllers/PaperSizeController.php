<?php

namespace App\Http\Controllers;

use App\Models\PaperSize;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaperSizeController extends Controller
{
    /**
     * Display a listing of the paper sizes.
     */
    public function index(): Response
    {
        return Inertia::render('paper-sizes/index', [
            'paperSizes' => PaperSize::latest()->get(),
        ]);
    }

    /**
     * Store a newly created paper size in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'width_mm' => 'required|integer|min:1',
            'height_mm' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
        ]);

        PaperSize::create($validated);

        return to_route('paper-sizes.index')->with('status', 'paper-size-created');
    }

    /**
     * Update the specified paper size in storage.
     */
    public function update(Request $request, PaperSize $paperSize): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'width_mm' => 'required|integer|min:1',
            'height_mm' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
        ]);

        $paperSize->update($validated);

        return to_route('paper-sizes.index')->with('status', 'paper-size-updated');
    }

    /**
     * Remove the specified paper size from storage.
     */
    public function destroy(PaperSize $paperSize): RedirectResponse
    {
        $paperSize->delete();

        return to_route('paper-sizes.index')->with('status', 'paper-size-deleted');
    }
}

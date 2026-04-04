<?php

namespace App\Http\Controllers;

use App\Models\Sticker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StickerController extends Controller
{
    /**
     * Display a listing of the stickers.
     */
    public function index(Request $request): Response
    {
        $query = Sticker::latest();

        // Search name or category
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('category', 'like', '%' . $request->search . '%');
            });
        }

        // Filter category
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        return Inertia::render('stickers/index', [
            'stickers' => $query->paginate(18)->withQueryString(),
            'categories' => Sticker::query()
                ->whereNotNull('category')
                ->distinct()
                ->pluck('category'),
            'filters' => $request->only(['search', 'category', 'status']),
        ]);
    }

    /**
     * Store a newly created sticker in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'is_active' => 'required|boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('stickers', 'public');
            $validated['image_path'] = $path;
        }

        Sticker::create($validated);

        return to_route('stickers.index')->with('status', 'sticker-created');
    }

    /**
     * Update the specified sticker in storage.
     */
    public function update(Request $request, Sticker $sticker): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'is_active' => 'required|boolean',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($sticker->image_path) {
                Storage::disk('public')->delete($sticker->image_path);
            }
            $path = $request->file('image')->store('stickers', 'public');
            $validated['image_path'] = $path;
        }

        $sticker->update($validated);

        return to_route('stickers.index')->with('status', 'sticker-updated');
    }

    /**
     * Remove the specified sticker from storage.
     */
    public function destroy(Sticker $sticker): RedirectResponse
    {
        if ($sticker->image_path) {
            Storage::disk('public')->delete($sticker->image_path);
        }

        $sticker->delete();

        return to_route('stickers.index')->with('status', 'sticker-deleted');
    }
}

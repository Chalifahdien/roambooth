<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;

class TemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('templates/index', [
            'templates' => Template::latest()->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $existingCategories = Template::whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->toArray();

        return Inertia::render('templates/Create', [
            'existingCategories' => $existingCategories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:reguler,koran,flipbook',
            'category' => 'nullable|string|max:255',
            'orientation' => 'required|in:portrait,landscape',
            'template_path' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // Max 10MB
        ]);

        if ($request->hasFile('template_path')) {
            $file = $request->file('template_path');
            $path = $file->store('templates', 'public');
            
            // Get image dimensions
            [$width, $height] = getimagesize(storage_path('app/public/' . $path));
            
            $template = Template::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'category' => $validated['category'],
                'orientation' => $validated['orientation'],
                'template_path' => $path,
                'image_width' => $width,
                'image_height' => $height,
                'frame_count' => 0,
                'is_active' => false,
            ]);

            return to_route('templates.edit', $template->id)->with('status', 'template-created');
        }

        return back()->withErrors(['template_path' => 'Template image is required.']);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Template $template): Response
    {
        $template->load('frames');
        
        $existingCategories = Template::whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->toArray();

        return Inertia::render('templates/edit', [
            'template' => $template,
            'existingCategories' => $existingCategories
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Template $template): RedirectResponse
    {
        $request->validate([
            'frames' => 'required|json',
            'name' => 'required|string|max:100',
            'category' => 'nullable|string|max:100',
        ]);

        $frames = json_decode($request->frames, true);

        // Delete existing frames
        $template->frames()->delete();

        foreach ($frames as $i => $f) {
            $template->frames()->create([
                'frame_order' => $i + 1,
                'x' => $f['x'],
                'y' => $f['y'],
                'width' => $f['width'],
                'height' => $f['height'],
                'angle' => $f['angle'] ?? 0,
                'shape' => $f['shape'],
                'path_data' => $f['path_data'] ?? null,
            ]);
        }

        $template->update([
            'frame_count' => count($frames),
            'name' => $request->name,
            'category' => $request->category,
            'is_active' => true, // Activate template when frames are set
        ]);

        return redirect()
            ->back()
            ->with('status', 'template-updated');
    }

    /**
     * Toggle active / inactive status.
     */
    public function toggle(Template $template): RedirectResponse
    {
        $template->update([
            'is_active' => !$template->is_active
        ]);

        return back()->with('status', $template->is_active ? 'template-activated' : 'template-deactivated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Template $template): RedirectResponse
    {
        // Delete frames first (in case of no DB cascade)
        $template->frames()->delete();

        // Delete physical file
        if ($template->template_path) {
            Storage::disk('public')->delete($template->template_path);
        }

        $template->delete();

        return to_route('templates.index')->with('status', 'template-deleted');
    }
}

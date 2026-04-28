<?php

namespace App\Http\Controllers;

use App\Models\PaperSize;
use App\Models\Template;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Spatie\LaravelImageOptimizer\Facades\ImageOptimizer;

class TemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Template::latest();

        // Search name or category
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('category', 'like', '%' . $request->search . '%');
            });
        }

        // Filter type
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter orientation
        if ($request->filled('orientation') && $request->orientation !== 'all') {
            $query->where('orientation', $request->orientation);
        }

        return Inertia::render('templates/index', [
            'templates' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'type', 'orientation']),
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
            'existingCategories' => $existingCategories,
            'paperSizes' => PaperSize::where('is_active', true)->get(),
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
            'paper_size_id' => 'required|exists:paper_sizes,id',
            'template_path' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // Max 10MB
        ]);

        if ($request->hasFile('template_path')) {
            // Tingkatkan memory limit secara dinamis karena template photobooth bisa memiliki resolusi sangat tinggi (memakan memori saat GD extract pixel map)
            ini_set('memory_limit', '512M');

            $file = $request->file('template_path');
            $filename = $file->hashName();
            $path = 'templates/' . $filename;
            $absolutePath = storage_path('app/public/' . $path);

            if (!file_exists(dirname($absolutePath))) {
                mkdir(dirname($absolutePath), 0755, true);
            }

            // Init ImageManager dengan GD driver
            $manager = new ImageManager(new Driver());
            $image = $manager->decodePath($file->getRealPath());

            // Dapatkan dimensi sebelum disimpan
            $width = $image->width();
            $height = $image->height();

            // Lakukan konversi orientasi/resolusi awal
            $extension = strtolower($file->getClientOriginalExtension());
            if (in_array($extension, ['jpg', 'jpeg', 'webp'])) {
                // Biarkan pada kualitas 100% untuk dikompresi losslessly secara ekstrem oleh Spatie Optimizer
                $image->encodeUsingFileExtension($extension, 100)->save($absolutePath);
            } elseif ($extension === 'png') {
                $image->encodeUsingFileExtension('png')->save($absolutePath);
            } else {
                // Fallback untuk format lain
                $file->storeAs('templates', $filename, 'public');
            }

            // Extreme Optimisation Pass (Visually Lossless tanpa memecah piksel)
            // Menggunakan pngquant, optipng, dan jpegoptim
            try {
                ImageOptimizer::optimize($absolutePath);
            } catch (\Exception $e) {
                // Ignore
            }
            
            $template = Template::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'category' => $validated['category'],
                'orientation' => $validated['orientation'],
                'paper_size_id' => $validated['paper_size_id'],
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

        $paperSizes = PaperSize::orderBy('name')->get();

        return Inertia::render('templates/Edit', [
            'template' => $template->load('frames'),
            'existingCategories' => $existingCategories,
            'paperSizes' => $paperSizes,
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
            'paper_size_id' => 'required|exists:paper_sizes,id',
            'type' => 'required|in:reguler,koran,flipbook',
            'orientation' => 'required|in:portrait,landscape',
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
            'paper_size_id' => $request->paper_size_id,
            'type' => $request->type,
            'orientation' => $request->orientation,
            'is_active' => true,
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
        // Prevent activation if no frames
        if (!$template->is_active && $template->frame_count === 0) {
            return back()->withErrors(['status' => 'Template harus memiliki minimal 1 frame untuk diaktifkan.']);
        }

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

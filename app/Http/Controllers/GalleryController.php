<?php

namespace App\Http\Controllers;

use App\Models\FinalImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    /**
     * Display a listing of final images in a gallery view.
     */
    public function index(Request $request): Response
    {
        $query = FinalImage::with(['transaction.machine', 'transaction.template'])
            ->whereNotNull('image_path')
            ->latest();

        // Search by Transaction ID (the string one from machine)
        if ($request->search) {
            $query->whereHas('transaction', function ($q) use ($request) {
                $q->where('transaction_id', 'like', '%' . $request->search . '%');
            });
        }

        $gallery = $query->paginate(18)->withQueryString();

        return Inertia::render('gallery/index', [
            'gallery' => $gallery,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Delete the media files associated with a transaction without deleting the record.
     */
    public function destroyMedia(FinalImage $finalImage)
    {
        // 1. Delete Final Image & Video
        if ($finalImage->image_path) {
            Storage::disk('public')->delete($finalImage->image_path);
        }
        if ($finalImage->video_path) {
            Storage::disk('public')->delete($finalImage->video_path);
        }

        // 2. Delete all Transaction Photos
        $transaction = $finalImage->transaction;
        if ($transaction) {
            foreach ($transaction->photos as $photo) {
                if ($photo->photo_path) {
                    Storage::disk('public')->delete($photo->photo_path);
                }
                // Update photo record
                $photo->update(['photo_path' => null]);
            }
        }

        // 3. Update Final Image record
        $finalImage->update([
            'image_path' => null,
            'video_path' => null,
        ]);

        return redirect()->back()->with('success', 'Media files deleted successfully.');
    }
}

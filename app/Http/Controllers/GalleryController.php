<?php

namespace App\Http\Controllers;

use App\Models\FinalImage;
use Illuminate\Http\Request;
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
}

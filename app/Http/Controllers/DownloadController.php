<?php

namespace App\Http\Controllers;

use App\Models\FinalImage;
use Illuminate\Http\Request;

class DownloadController extends Controller
{
    public function show(string $token)
    {
        $finalImage = FinalImage::with(['transaction.machine', 'transaction.photos'])
            ->where('token', $token)
            ->firstOrFail();

        return view('downloads', compact('finalImage'));
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Sticker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StickerController extends Controller
{
    /**
     * Get active stickers for the photobooth machine.
     */
    public function index(Request $request): JsonResponse
    {
        $token = $request->header('X-Machine-Token');

        if (!$token) {
            return response()->json(['message' => 'Machine token is required'], 401);
        }

        $machine = Machine::where('token', $token)->where('is_active', true)->first();

        if (!$machine) {
            return response()->json(['message' => 'Invalid or inactive machine token'], 403);
        }

        $stickers = Sticker::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $stickers
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    /**
     * Get active templates for the photobooth machine.
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

        $request->validate([
            'type' => 'required|in:koran,reguler,flipbook',
        ]);

        $templates = Template::with(['frames', 'paperSize'])
            ->where('is_active', true)
            ->where('type', $request->type)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }
}

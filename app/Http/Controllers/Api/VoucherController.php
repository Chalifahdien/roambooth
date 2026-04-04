<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * Validate a voucher code for a machine.
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
            'code' => 'required|string|size:8',
            'type' => 'required|string|in:koran,reguler,flipbook',
        ]);

        $voucher = Voucher::where('code', strtoupper($request->code))->first();

        if (!$voucher) {
            return response()->json([
                'valid' => false,
                'message' => 'Voucher not valid!'
            ], 404);
        }

        if ($voucher->status === 'used') {
            return response()->json([
                'valid' => false,
                'message' => 'Voucher has already been used',
                'used_at' => $voucher->updated_at
            ], 422);
        }

        if ($voucher->type !== $request->type) {
            return response()->json([
                'valid' => false,
                'message' => 'Voucher type does not match',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Voucher is ready to use',
            'data' => [
                'code' => $voucher->code,
                'type' => $voucher->type, // koran, reguler, flipbook
                'status' => $voucher->status
            ]
        ]);
    }
}

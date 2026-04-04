<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    /**
     * Store a new transaction from the photobooth machine.
     */
    public function store(Request $request): JsonResponse
    {
        $token = $request->header('X-Machine-Token');

        if (!$token) {
            return response()->json(['message' => 'Machine token is required'], 401);
        }

        $machine = Machine::where('token', $token)->where('is_active', true)->first();

        if (!$machine) {
            return response()->json(['message' => 'Invalid or inactive machine token'], 403);
        }

        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|string|unique:transactions,transaction_id',
            'amount' => 'required|integer',
            'template_id' => 'nullable|exists:templates,id',
            'payment_type' => 'nullable|string',
            'status' => 'nullable|string',
            'started_at' => 'required|date_format:Y-m-d H:i:s',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $transaction = Transaction::create([
            'transaction_id' => $request->transaction_id,
            'machine_id' => $machine->id,
            'amount' => $request->amount,
            'payment_type' => $request->payment_type,
            'template_id' => $request->template_id,
            'status' => $request->status ?? 'WAITING_PAYMENT',
            'started_at' => $request->started_at,
            'expires_at' => now()->addMinutes(30), // Default expiry 30 mins
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction
        ], 201);
    }
}

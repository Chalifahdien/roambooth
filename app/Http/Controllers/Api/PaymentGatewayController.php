<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\PaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentGatewayController extends Controller
{
    /**
     * Get the active payment gateway configuration.
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

        $gateways = PaymentGateway::where('is_active', true)->first();

        if ($gateways->isEmpty()) {
            return response()->json(['message' => 'No active payment gateway configured'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $gateways->map(fn($gateway) => [
                'name' => $gateway->name,
                'client_key' => $gateway->client_key,
                'server_key' => $gateway->server_key,
                'merchant_id' => $gateway->merchant_id,
                'is_production' => $gateway->is_production,
            ])
        ]);
    }
}

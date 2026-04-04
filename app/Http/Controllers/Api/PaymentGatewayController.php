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

        $gateway = PaymentGateway::where('is_active', true)->first();

        if (!$gateway) {
            return response()->json(['message' => 'No active payment gateway configured'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $gateway->name,
                'client_key' => $gateway->client_key,
                'server_key' => $gateway->server_key,
                'merchant_id' => $gateway->merchant_id,
                'is_production' => (bool) $gateway->is_production,
                'amount_koran' => $machine->amount_koran,
                'amount_reguler' => $machine->amount_reguler,
                'amount_flipbook' => $machine->amount_flipbook,
                'amount_print_koran' => $machine->amount_print_koran,
                'amount_print_reguler' => $machine->amount_print_reguler,
                'amount_print_flipbook' => $machine->amount_print_flipbook,
            ]
        ]);
    }
}

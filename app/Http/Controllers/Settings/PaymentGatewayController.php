<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentGatewayController extends Controller
{
    /**
     * Show the payment gateway settings.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/payment-gateway', [
            'gateways' => PaymentGateway::all(),
            'status' => session('status'),
        ]);
    }

    /**
     * Update the payment gateway tokens.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'gateways' => 'required|array',
            'gateways.*.id' => 'required|exists:payment_gateways,id',
            'gateways.*.client_key' => 'nullable|string',
            'gateways.*.server_key' => 'nullable|string',
            'gateways.*.merchant_id' => 'nullable|string',
            'gateways.*.is_production' => 'boolean',
            'active_gateway_id' => 'nullable|exists:payment_gateways,id',
        ]);

        $gateways = $request->input('gateways');
        $activeId = $request->input('active_gateway_id');

        foreach ($gateways as $data) {
            PaymentGateway::where('id', $data['id'])->update([
                'client_key' => $data['client_key'],
                'server_key' => $data['server_key'],
                'merchant_id' => $data['merchant_id'],
                'is_production' => $data['is_production'] ?? false,
                'is_active' => $data['id'] == $activeId,
            ]);
        }

        return back()->with('status', 'payment-gateway-updated');
    }
}

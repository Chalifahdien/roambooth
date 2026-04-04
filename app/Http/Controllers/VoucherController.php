<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    /**
     * Display a listing of the vouchers.
     */
    public function index(Request $request): Response
    {
        $query = Voucher::latest();

        // Search by code
        if ($request->filled('search')) {
            $query->where('code', 'like', '%' . $request->search . '%');
        }

        // Filter by type
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return Inertia::render('vouchers/index', [
            'vouchers' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    /**
     * Store a newly created voucher in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:koran,reguler,flipbook',
        ]);

        Voucher::create($validated);

        return to_route('vouchers.index')->with('status', 'voucher-created');
    }

    /**
     * Update the specified voucher in storage.
     */
    public function update(Request $request, Voucher $voucher): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:koran,reguler,flipbook',
            'status' => 'required|in:ready,used',
            'code' => 'nullable|string|max:8',
        ]);

        $voucher->update($validated);

        return to_route('vouchers.index')->with('status', 'voucher-updated');
    }

    /**
     * Remove the specified voucher from storage.
     */
    public function destroy(Voucher $voucher): RedirectResponse
    {
        $voucher->delete();

        return to_route('vouchers.index')->with('status', 'voucher-deleted');
    }
}

<?php

use App\Models\Machine;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Voucher;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard returns expected inertia props contract', function () {
    $user = User::factory()->create();
    $machine = Machine::create([
        'name' => 'Booth Test',
        'is_active' => true,
        'payment_required' => true,
    ]);
    $voucher = Voucher::create([
        'type' => 'reguler',
        'status' => 'ready',
    ]);

    Transaction::create([
        'transaction_id' => 'TRX-TEST-001',
        'machine_id' => $machine->id,
        'amount' => 25000,
        'status' => 'SUCCESS',
        'voucher_id' => $voucher->id,
        'started_at' => now()->subMinutes(10),
        'finished_at' => now()->subMinutes(2),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('stats', 4)
        ->has('recentActivities')
        ->has('performanceTargets', 3)
        ->has('transactionChartData', 7)
        ->where('stats.0.icon', 'credit-card')
        ->where('stats.1.icon', 'dollar-sign')
        ->where('stats.2.icon', 'camera')
        ->where('stats.3.icon', 'ticket')
    );
});
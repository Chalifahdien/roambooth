<?php

use App\Http\Controllers\MachineController;
use App\Http\Controllers\PaperSizeController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\Settings\PaymentGatewayController;
use App\Http\Controllers\StickerController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('machines', MachineController::class);
    Route::resource('paper-sizes', PaperSizeController::class);
    Route::resource('stickers', StickerController::class);
    Route::resource('transactions', TransactionController::class);
    Route::resource('vouchers', VoucherController::class);
    Route::get('gallery', [\App\Http\Controllers\GalleryController::class, 'index'])->name('gallery.index');

    // Settings
    Route::get('settings/payment-gateway', [PaymentGatewayController::class, 'edit'])->name('settings.payment-gateway.edit');
    Route::put('settings/payment-gateway', [PaymentGatewayController::class, 'update'])->name('settings.payment-gateway.update');
});
Route::resource('templates', TemplateController::class);
Route::patch('templates/{template}/toggle', [TemplateController::class, 'toggle'])->name('templates.toggle');

require __DIR__ . '/settings.php';

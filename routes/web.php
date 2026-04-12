<?php

use App\Http\Controllers\DownloadController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\MachineController;
use App\Http\Controllers\PaperSizeController;
use App\Http\Controllers\Settings\PaymentGatewayController;
use App\Http\Controllers\StickerController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('machines', MachineController::class);
    Route::resource('paper-sizes', PaperSizeController::class);
    Route::resource('stickers', StickerController::class);
    Route::resource('templates', TemplateController::class);
    Route::patch('templates/{template}/toggle', [TemplateController::class, 'toggle'])->name('templates.toggle');
    Route::resource('transactions', TransactionController::class);
    Route::resource('vouchers', VoucherController::class);
    Route::get('gallery', [GalleryController::class, 'index'])->name('gallery.index');
    Route::delete('gallery/{finalImage}/media', [GalleryController::class, 'destroyMedia'])->name('gallery.media.destroy');

    // Settings
    Route::get('settings/payment-gateway', [PaymentGatewayController::class, 'edit'])->name('settings.payment-gateway.edit');
    Route::put('settings/payment-gateway', [PaymentGatewayController::class, 'update'])->name('settings.payment-gateway.update');
});

require __DIR__ . '/settings.php';

Route::get('/downloads/{token}', [DownloadController::class, 'show']);

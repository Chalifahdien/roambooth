<?php

use App\Http\Controllers\Api\PaymentGatewayController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\StickerController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\FinalImageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/payment-gateway', [PaymentGatewayController::class, 'index']);
Route::get('/templates', [TemplateController::class, 'index']);
Route::get('/stickers', [StickerController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::post('/final-images', [FinalImageController::class, 'store']);
Route::post('/final-images/{id}/print', [FinalImageController::class, 'print']);
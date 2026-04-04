<?php

use App\Http\Controllers\MachineController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('machines', MachineController::class);
    Route::resource('templates', TemplateController::class);
    Route::patch('templates/{template}/toggle', [TemplateController::class, 'toggle'])->name('templates.toggle');
});

require __DIR__.'/settings.php';

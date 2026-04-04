<?php

namespace Database\Seeders;

use App\Models\PaymentGateway;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        PaymentGateway::updateOrCreate(['name' => 'Midtrans'], ['is_active' => false]);
        PaymentGateway::updateOrCreate(['name' => 'Doku'], ['is_active' => false]);
    }
}

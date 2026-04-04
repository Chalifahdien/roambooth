<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            $table->unsignedInteger('amount_koran')->default(0)->after('payment_required');
            $table->unsignedInteger('amount_reguler')->default(0)->after('amount_koran');
            $table->unsignedInteger('amount_flipbook')->default(0)->after('amount_reguler');
            $table->unsignedInteger('amount_print_koran')->default(0)->after('amount_flipbook');
            $table->unsignedInteger('amount_print_reguler')->default(0)->after('amount_print_koran');
            $table->unsignedInteger('amount_print_flipbook')->default(0)->after('amount_print_reguler');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            $table->dropColumn([
                'amount_koran',
                'amount_reguler',
                'amount_flipbook',
                'amount_print_koran',
                'amount_print_reguler',
                'amount_print_flipbook'
            ]);
        });
    }
};

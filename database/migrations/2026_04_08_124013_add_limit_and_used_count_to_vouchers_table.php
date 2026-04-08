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
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedInteger('limit')->default(1)->after('status')->comment('Maximum times this voucher can be used');
            $table->unsignedInteger('used_count')->default(0)->after('limit')->comment('Current usage count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['limit', 'used_count']);
        });
    }
};

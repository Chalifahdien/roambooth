<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('final_images', function (Blueprint $table) {
            $table->id();
            $table->string('token', 8)->unique();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->string('image_path')->nullable();
            $table->string('video_path')->nullable();
            $table->integer('amount_print')->nullable();
            $table->integer('print_quantity')->default(1);
            $table->boolean('printed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('final_images');
    }
};

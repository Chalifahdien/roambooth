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
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['reguler', 'koran', 'flipbook']);
            $table->string('category')->nullable();
            $table->string('orientation')->default('portrait');
            $table->string('template_path');
            $table->integer('image_width')->nullable();
            $table->integer('image_height')->nullable();
            $table->integer('frame_count')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};

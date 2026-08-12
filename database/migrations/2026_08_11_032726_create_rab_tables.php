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
        Schema::create('rabs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('proyek_id');
            $table->uuid('titik_id')->nullable();
            $table->enum('kategori', ['bahan_baku', 'sparepart', 'sdm_tetap', 'sdm_kondisional', 'lainnya']);
            $table->decimal('rencana', 15, 2);
            $table->text('catatan')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('proyek_id')->references('id')->on('proyeks');
            $table->foreign('titik_id')->references('id')->on('titiks');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rab');
    }
};

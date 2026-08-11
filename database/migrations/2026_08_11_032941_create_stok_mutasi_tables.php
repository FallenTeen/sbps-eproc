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
        Schema::create('stok_mutasi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bahan_baku_id');
            $table->uuid('titik_id');
            $table->enum('tipe', ['masuk', 'keluar']);
            $table->decimal('jumlah', 15, 2);
            $table->nullableMorphs('referensi'); // polymorphic: purchase_orders, production_sessions, dll
            $table->text('catatan')->nullable();
            $table->date('tanggal');
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('bahan_baku_id')->references('id')->on('bahan_baku');
            $table->foreign('titik_id')->references('id')->on('titik');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stok_mutasi');
    }
};

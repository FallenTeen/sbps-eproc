<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tempat password halaman publik /rekap-publik (terenkripsi
     * reversible via Crypt). Bisa diganti sendiri oleh pemegang
     * permission 'manage rekap keuangan'.
     * Jika belum diatur (password kosong), halaman publik bebas diakses.
     */
    public function up(): void
    {
        Schema::create('rekap_publik_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('password')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rekap_publik_settings');
    }
};

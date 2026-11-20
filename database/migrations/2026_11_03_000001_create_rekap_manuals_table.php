<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel penanda baris mutasi yang dibuat manual via menu
     * "Rekap Pemasukan & Pengeluaran". Baris mutasi aktual TETAP
     * disimpan di mutasi_kas_banks (referensi polymorphic → tabel ini),
     * sehingga saldo kas & rekap selalu konsisten.
     */
    public function up(): void
    {
        Schema::create('rekap_manuals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rekap_manuals');
    }
};

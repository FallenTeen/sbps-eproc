<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fase D (Bagian 21.7) — Checklist inventarisasi (stok opname).
     *
     * Satu baris = satu item (bahan baku/sparepart) di satu titik untuk satu
     * tanggal opname. `saldo_sistem` adalah snapshot saldo hasil
     * GetStokSaldoAction saat opname dibuat; `selisih` dihitung
     * (saldo_fisik - saldo_sistem), bukan disimpan manual.
     */
    public function up(): void
    {
        Schema::create('stok_opnames', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bahan_baku_id');
            $table->uuid('titik_id');
            $table->date('tanggal');
            $table->decimal('saldo_sistem', 12, 2)->default(0);
            $table->decimal('saldo_fisik', 12, 2)->default(0);
            $table->decimal('selisih', 12, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->uuid('dicatat_oleh');
            $table->timestamps();

            $table->foreign('bahan_baku_id')->references('id')->on('bahan_bakus');
            $table->foreign('titik_id')->references('id')->on('titiks');
            $table->foreign('dicatat_oleh')->references('id')->on('users');

            $table->unique(['bahan_baku_id', 'titik_id', 'tanggal'], 'stok_opname_item_per_hari_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stok_opnames');
    }
};

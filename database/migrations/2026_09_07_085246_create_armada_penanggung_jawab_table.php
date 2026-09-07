<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * v6 (Bagian 21.2) — riwayat penanggung jawab armada (utama & cadangan).
     * Banyak baris per armada sepanjang waktu; "PIC aktif" = peran=utama, sampai IS NULL
     * (fallback ke cadangan aktif kalau utama sedang non-aktif).
     */
    public function up(): void
    {
        Schema::create('armada_penanggung_jawabs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('karyawan_id');
            $table->enum('peran', ['utama', 'cadangan']);
            $table->date('mulai_dari');
            $table->date('sampai')->nullable(); // null = masih aktif
            $table->string('alasan')->nullable(); // wajib saat switch ke cadangan
            $table->uuid('created_by')->nullable();

            $table->timestamps();

            $table->foreign('armada_id')->references('id')->on('armadas')->onDelete('cascade');
            $table->foreign('karyawan_id')->references('id')->on('karyawans');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armada_penanggung_jawabs');
    }
};

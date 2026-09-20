<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 21.10 — Checklist Armada Major (Serah Terima Sewa).
 *
 * Berbeda dari checklist harian (21.3): pengecekan menyeluruh saat armada
 * akan disewa (serah terima), form `berangkat` & `kembali` (dua baris per
 * transaksi sewa), output dokumen cetak (PDF).
 *
 * `data_penyewa` = snapshot dari `sewa_alat_jams` (PT, alamat,
 * penanggung_jawab, no_hp) — JANGAN input ulang (prinsip: ambil dari 21.5).
 * `foto_kondisi` = JSON array path (banyak foto per sisi unit).
 * `pemakaian` (selisih ODO/HM kembali - berangkat) TIDAK disimpan —
 * dihitung on-the-fly (prinsip Bagian 0 #1: data turunan tidak disimpan).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_serah_terima_armada', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sewa_alat_jam_id');
            $table->uuid('armada_id');
            $table->string('tipe'); // berangkat | kembali
            $table->json('data_penyewa')->nullable();
            $table->decimal('odo_atau_hm', 12, 2)->nullable();
            $table->json('foto_kondisi')->nullable(); // array path (banyak foto/sisi)
            $table->text('catatan')->nullable();
            $table->string('ditandatangani_oleh')->nullable();
            $table->date('tanggal');
            $table->uuid('dicatat_oleh_id')->nullable();
            $table->timestamps();

            $table->foreign('sewa_alat_jam_id')->references('id')->on('sewa_alat_jams')->cascadeOnDelete();
            $table->foreign('armada_id')->references('id')->on('armadas')->cascadeOnDelete();
            $table->foreign('dicatat_oleh_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['sewa_alat_jam_id', 'tipe']);
        });

        Schema::create('checklist_serah_terima_detail', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('checklist_serah_terima_armada_id');
            $table->string('item');
            $table->string('kondisi'); // baik | rusak
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('checklist_serah_terima_armada_id', 'fk_cst_detail_csta_id')
                ->references('id')->on('checklist_serah_terima_armada')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_serah_terima_detail');
        Schema::dropIfExists('checklist_serah_terima_armada');
    }
};

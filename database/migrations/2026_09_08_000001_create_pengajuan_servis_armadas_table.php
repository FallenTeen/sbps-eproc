<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 21.8 — Sistem Servis Armada (Form Multi-Bagian).
 *
 * Satu model `pengajuan_servis_armada` menampung 4 kelompok kolom (bukan 4
 * tabel terpisah), supaya "1 form" berlaku secara data juga. Status adalah
 * state machine (`spatie/laravel-model-states`), bukan enum biasa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_servis_armadas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode_pengajuan')->nullable()->index();

            // Bagian 1 — Ajuan (PIC/operator/driver via mobile)
            $table->date('tanggal_ajuan');
            $table->uuid('armada_id');
            $table->uuid('diajukan_oleh');          // user PIC/operator/driver
            $table->string('foto_armada')->nullable();
            $table->text('catatan_ajuan')->nullable();

            // Bagian 2 — Approval (Ketua Divisi Armada)
            $table->text('catatan_acc')->nullable();
            $table->string('status')->default('diajukan');
            $table->uuid('disetujui_oleh')->nullable();
            $table->date('tanggal_acc')->nullable();

            // Bagian 3 — Pengerjaan (Workshop)
            $table->date('tanggal_mulai_kerja')->nullable();
            $table->date('tanggal_selesai_kerja')->nullable();
            $table->text('catatan_pengerjaan')->nullable();
            $table->boolean('butuh_sparepart')->default(false);

            // Bagian 4 — Status pengadaan sparepart (Inventory)
            $table->string('status_pengadaan_sparepart')->nullable();

            // Selesai — snapshot untuk service_history
            $table->decimal('total_biaya', 15, 2)->default(0);
            $table->date('tanggal_selesai')->nullable();

            $table->timestamps();

            $table->foreign('armada_id')->references('id')->on('armadas');
            $table->foreign('diajukan_oleh')->references('id')->on('users');
            $table->foreign('disetujui_oleh')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_servis_armadas');
    }
};

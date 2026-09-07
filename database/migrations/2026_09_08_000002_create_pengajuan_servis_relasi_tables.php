<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 21.8 — tabel relasi servis armada.
 *
 * 1. `pengajuan_servis_personels` — pivot personel Workshop yang mengerjakan
 *    (bagian 3, bisa multi).
 * 2. `pengajuan_servis_spareparts` — item sparepart ringan yang dibelanjakan
 *    Inventory (bagian 4); bukan relasi ke purchase_order (keputusan: tabel
 *    ringan terpisah, lihat 21.8).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_servis_personels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pengajuan_servis_armada_id');
            $table->string('nama_personel');
            $table->string('peran')->nullable();
            $table->timestamps();

            $table->foreign('pengajuan_servis_armada_id')
                ->references('id')->on('pengajuan_servis_armadas')->cascadeOnDelete();
        });

        Schema::create('pengajuan_servis_spareparts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pengajuan_servis_armada_id');
            $table->string('nama_item');
            $table->decimal('jumlah', 12, 2)->default(1);
            $table->string('satuan')->nullable();
            $table->decimal('nominal', 15, 2)->default(0);
            $table->date('tanggal')->nullable();
            $table->string('foto_nota')->nullable();
            $table->string('status')->default('diajukan'); // diajukan | tersedia
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('pengajuan_servis_armada_id')
                ->references('id')->on('pengajuan_servis_armadas')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_servis_spareparts');
        Schema::dropIfExists('pengajuan_servis_personels');
    }
};

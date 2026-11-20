<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('armada_dokumen_berkalas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('armada_id')->constrained('armadas')->cascadeOnDelete();
            $table->enum('jenis', ['pajak_tahunan', 'stnk_5_tahunan', 'kir']);
            $table->string('nomor_dokumen')->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->date('tanggal_jatuh_tempo');
            $table->decimal('nominal_biaya', 15, 2)->nullable();
            $table->string('wilayah')->nullable();
            $table->string('tempat_pembayaran')->nullable();
            $table->text('teknis_pembayaran')->nullable();
            $table->json('reminder_hari_sebelum')->nullable();
            $table->timestamp('terakhir_dibayar_pada')->nullable();
            $table->text('catatan')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['armada_id', 'jenis']);
            $table->index('tanggal_jatuh_tempo');
        });

        Schema::create('armada_dokumen_berkala_riwayats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('dokumen_berkala_id')->constrained('armada_dokumen_berkalas')->cascadeOnDelete();
            $table->date('tanggal_jatuh_tempo_lama');
            $table->date('tanggal_jatuh_tempo_baru');
            $table->decimal('nominal_biaya', 15, 2)->nullable();
            $table->string('nomor_dokumen_baru')->nullable();
            $table->foreignUuid('diperpanjang_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armada_dokumen_berkala_riwayats');
        Schema::dropIfExists('armada_dokumen_berkalas');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // production_sessions
        Schema::create('production_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mesin_id');
            $table->uuid('titik_id');
            $table->uuid('produk_id');
            $table->uuid('operator_karyawan_id');
            $table->datetime('mulai');
            $table->datetime('selesai')->nullable();
            $table->decimal('hasil_output', 15, 2)->nullable();
            $table->enum('status', ['berjalan', 'selesai', 'dibatalkan'])->default('berjalan');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('mesin_id')->references('id')->on('mesin_produksis');
            $table->foreign('titik_id')->references('id')->on('titiks');
            $table->foreign('produk_id')->references('id')->on('produks');
            $table->foreign('operator_karyawan_id')->references('id')->on('karyawans');
        });

        // production_session_items (realisasi konsumsi)
        Schema::create('production_session_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('production_session_id');
            $table->uuid('bahan_baku_id');
            $table->decimal('jumlah_terpakai', 15, 4);
            $table->timestamps();

            $table->foreign('production_session_id')->references('id')->on('production_sessions')->onDelete('cascade');
            $table->foreign('bahan_baku_id')->references('id')->on('bahan_bakus');
        });

        // qc_sample (hanya untuk beton)
        Schema::create('qc_samples', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('production_session_id');
            $table->enum('jenis_uji', ['slump_test', 'uji_tekan']);
            $table->decimal('nilai_slump', 8, 2)->nullable();
            $table->date('tanggal_uji_tekan_rencana')->nullable(); // +28 hari
            $table->decimal('hasil_uji_tekan', 8, 2)->nullable();
            $table->enum('status', ['menunggu_hasil', 'lolos', 'tidak_lolos'])->default('menunggu_hasil');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('production_session_id')->references('id')->on('production_sessions');
        });

        // pengiriman
        Schema::create('pengirimans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('production_session_id');
            $table->uuid('armada_id')->nullable(); // truck molen
            $table->uuid('driver_karyawan_id')->nullable();
            $table->string('tujuan_alamat');
            $table->datetime('waktu_muat');
            $table->datetime('waktu_tiba_tujuan')->nullable();
            $table->datetime('waktu_selesai_tuang')->nullable();
            $table->enum('status', ['dijadwalkan', 'dalam_perjalanan', 'selesai', 'dibatalkan'])->default('dijadwalkan');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('production_session_id')->references('id')->on('production_sessions');
            $table->foreign('armada_id')->references('id')->on('armadas');
            $table->foreign('driver_karyawan_id')->references('id')->on('karyawans');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_sessions');
        Schema::dropIfExists('production_session_items');
        Schema::dropIfExists('qc_samples');
        Schema::dropIfExists('pengirimans');
    }
};

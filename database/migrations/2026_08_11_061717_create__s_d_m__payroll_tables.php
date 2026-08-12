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
        // karyawan (dengan field tambahan)
        Schema::create('karyawans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->unique();
            $table->string('nama');
            $table->enum('tipe', ['tetap', 'harian', 'borongan_rit']);
            $table->string('jabatan')->nullable();
            $table->decimal('rate_gaji_pokok', 15, 2)->nullable(); // untuk tetap
            $table->decimal('rate_harian', 15, 2)->nullable(); // untuk harian
            $table->string('npwp')->nullable();
            $table->string('no_bpjs_kesehatan')->nullable();
            $table->string('no_bpjs_ketenagakerjaan')->nullable();
            $table->string('status_ptkp')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        // assignment karyawan ke titik
        Schema::create('karyawan_titik_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('karyawan_id');
            $table->uuid('titik_id');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->timestamps();

            $table->foreign('karyawan_id')->references('id')->on('karyawans');
            $table->foreign('titik_id')->references('id')->on('titiks');
        });

        // cuti
        Schema::create('cutis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('karyawan_id');
            $table->enum('tipe', ['tahunan', 'sakit', 'izin', 'tanpa_keterangan']);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->enum('status', ['diajukan', 'disetujui', 'ditolak'])->default('diajukan');
            $table->uuid('disetujui_oleh')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('karyawan_id')->references('id')->on('karyawans');
            $table->foreign('disetujui_oleh')->references('id')->on('users');
        });

        // gaji_periode (tanpa kolom total_gaji)
        Schema::create('gaji_periodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('karyawan_id');
            $table->integer('periode_bulan');
            $table->integer('periode_tahun');
            $table->integer('jumlah_hadir')->default(0);
            $table->enum('status', ['draft', 'dibayar'])->default('draft');
            $table->date('tanggal_dibayar')->nullable();
            $table->uuid('akun_kas_bank_id')->nullable();
            $table->timestamps();

            $table->foreign('karyawan_id')->references('id')->on('karyawans');
            $table->foreign('akun_kas_bank_id')->references('id')->on('akun_kas_banks');
        });

        // komponen_gaji
        Schema::create('komponen_gajis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('gaji_periode_id');
            $table->string('jenis'); // gaji_pokok, tunjangan, bpjs_kesehatan_potongan, pph21_potongan, potongan_manual, dll
            $table->decimal('jumlah', 15, 2);
            $table->string('keterangan')->nullable();
            $table->timestamps();

            $table->foreign('gaji_periode_id')->references('id')->on('gaji_periodes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('karyawans');
        Schema::dropIfExists('karyawan_titik_assignments');
        Schema::dropIfExists('cutis');
        Schema::dropIfExists('gaji_periodes');
        Schema::dropIfExists('komponen_gajis');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fase C (Bagian 21.6) — Helper Armada & Presensi Individu.
     *
     * - `helper_armada`: tenaga bantu serabutan yang diinput oleh PIC armada
     *   (web: nama, no HP, honor, durasi tanggal), tanpa akun/login.
     *   Ownership object-level: `created_by` menentukan siapa PIC yang berhak
     *   melihat/mengelola helper ini (BUKAN role-based generik).
     * - `presensi_helper`: presensi individu helper, dicatat SELALU oleh PIC
     *   (helper tidak pernah check-in sendiri). 1 baris per (helper, tanggal)
     *   berisi check_in + check_out beserta foto.
     */
    public function up(): void
    {
        Schema::create('helper_armadas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->string('nama');
            $table->string('no_hp', 30)->nullable();
            $table->string('foto')->nullable();
            $table->decimal('honor', 12, 2)->default(0);
            $table->date('durasi_mulai');
            $table->date('durasi_selesai')->nullable();
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('armada_id')->references('id')->on('armadas');
            $table->foreign('created_by')->references('id')->on('users');
        });

        Schema::create('presensi_helpers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('helper_armada_id');
            $table->date('tanggal');
            $table->dateTime('check_in')->nullable();
            $table->string('foto_check_in')->nullable();
            $table->dateTime('check_out')->nullable();
            $table->string('foto_check_out')->nullable();
            $table->uuid('dicatat_oleh');
            $table->timestamps();

            $table->foreign('helper_armada_id')->references('id')->on('helper_armadas');
            $table->foreign('dicatat_oleh')->references('id')->on('users');

            $table->unique(['helper_armada_id', 'tanggal'], 'presensi_helper_per_hari_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presensi_helpers');
        Schema::dropIfExists('helper_armadas');
    }
};

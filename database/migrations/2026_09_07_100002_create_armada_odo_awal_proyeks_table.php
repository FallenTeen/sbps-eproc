<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fase B (Bagian 21.3, sub-fitur #2) — ODO awal proyek.
     * Diinput SEKALI saat armada pertama kali beroperasi di suatu proyek;
     * dipakai sebagai baseline jarak kantor pusat <-> proyek.
     * Guard: 1 baris per (armada_id, proyek_id).
     */
    public function up(): void
    {
        Schema::create('armada_odo_awal_proyeks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('proyek_id');
            $table->decimal('odo_awal', 12, 2);
            $table->decimal('jarak_ke_pusat_km', 8, 2)->nullable();
            $table->uuid('dicatat_oleh_karyawan_id');
            $table->date('tanggal');
            $table->timestamps();

            $table->foreign('armada_id')->references('id')->on('armadas');
            $table->foreign('proyek_id')->references('id')->on('proyeks');
            $table->foreign('dicatat_oleh_karyawan_id')->references('id')->on('karyawans');

            $table->unique(['armada_id', 'proyek_id'], 'armada_odo_awal_proyek_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armada_odo_awal_proyeks');
    }
};

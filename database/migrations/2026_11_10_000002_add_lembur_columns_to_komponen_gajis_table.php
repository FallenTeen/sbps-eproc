<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom lembur pada komponen gaji.
 * Satu baris komponen `lembur` = satu tanggal presensi (snapshot tarif per
 * tanggal, sehingga tarif bisa berbeda di dalam satu periode). `diedit_manual`
 * menjaga nilai yang dikoreksi admin agar tidak tertimpa refresh payroll.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('komponen_gajis', function (Blueprint $table) {
            $table->date('lembur_tanggal')->nullable()->after('keterangan');
            $table->unsignedInteger('lembur_jam_menit')->nullable()->after('lembur_tanggal');
            $table->decimal('lembur_tarif_jam', 14, 2)->nullable()->after('lembur_jam_menit');
            $table->boolean('diedit_manual')->default(false)->after('lembur_tarif_jam');
        });
    }

    public function down(): void
    {
        Schema::table('komponen_gajis', function (Blueprint $table) {
            $table->dropColumn(['lembur_tanggal', 'lembur_jam_menit', 'lembur_tarif_jam', 'diedit_manual']);
        });
    }
};

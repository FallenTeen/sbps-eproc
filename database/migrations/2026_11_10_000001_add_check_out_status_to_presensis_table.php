<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Flag independen hasil validasi radius saat check-out.
 * TIDAK menggantikan `status_validasi` (kolom itu dipakai payroll utk hitung
 * kehadiran); checkout di luar radius tidak boleh membatalkan kehadiran.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->enum('check_out_status', ['valid', 'luar_radius'])
                ->nullable()
                ->after('status_validasi');
        });
    }

    public function down(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->dropColumn('check_out_status');
        });
    }
};

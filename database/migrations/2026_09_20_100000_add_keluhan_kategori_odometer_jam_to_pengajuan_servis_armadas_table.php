<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan 4 kolom form Pengajuan Servis Armada yang hilang.
 * Field-field ini dikirim oleh mobile Flutter app, divalidasi di Controller,
 * tapi sebelumnya TIDAK disimpan (DATA LOSS).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_servis_armadas', function (Blueprint $table) {
            $table->text('keluhan')->nullable()->after('catatan_ajuan');
            $table->string('kategori')->nullable()->after('keluhan');
            $table->decimal('odometer_saat_ajuan', 12, 2)->nullable()->after('kategori');
            $table->decimal('jam_operasional_saat_ajuan', 10, 2)->nullable()->after('odometer_saat_ajuan');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_servis_armadas', function (Blueprint $table) {
            $table->dropColumn([
                'keluhan',
                'kategori',
                'odometer_saat_ajuan',
                'jam_operasional_saat_ajuan',
            ]);
        });
    }
};

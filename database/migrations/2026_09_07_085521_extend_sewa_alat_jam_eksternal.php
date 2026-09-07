<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * v6 (Bagian 21.5) — sewa alat berat eksternal (non-proyek).
     * `tipe_sewa` = internal | eksternal. Data penyewa eksternal wajib kalau eksternal.
     */
    public function up(): void
    {
        Schema::table('sewa_alat_jams', function (Blueprint $table) {
            $table->enum('tipe_sewa', ['internal', 'eksternal'])
                ->default('internal')
                ->after('armada_id');
            $table->string('penyewa_nama')->nullable()->after('penyewa_eksternal');
            $table->string('penyewa_pt')->nullable()->after('penyewa_nama');
            $table->string('penyewa_alamat')->nullable()->after('penyewa_pt');
            $table->string('penyewa_penanggung_jawab')->nullable()->after('penyewa_alamat');
            $table->string('penyewa_no_hp')->nullable()->after('penyewa_penanggung_jawab');
        });
    }

    public function down(): void
    {
        Schema::table('sewa_alat_jams', function (Blueprint $table) {
            $table->dropColumn([
                'tipe_sewa',
                'penyewa_nama',
                'penyewa_pt',
                'penyewa_alamat',
                'penyewa_penanggung_jawab',
                'penyewa_no_hp',
            ]);
        });
    }
};

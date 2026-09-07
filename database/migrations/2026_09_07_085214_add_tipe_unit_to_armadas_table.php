<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * v6 (Bagian 21.1) — klasifikasi armada bergerak (jalan raya) vs alat berat stasioner.
     */
    public function up(): void
    {
        Schema::table('armadas', function (Blueprint $table) {
            $table->enum('tipe_unit', ['armada_jalan', 'alat_berat'])
                ->default('armada_jalan')
                ->after('jenis');
        });

        // Seed data existing: jenis 'alat_berat' -> alat_berat, selainnya -> armada_jalan
        DB::table('armadas')
            ->where('jenis', 'alat_berat')
            ->update(['tipe_unit' => 'alat_berat']);

        DB::table('armadas')
            ->where('jenis', '!=', 'alat_berat')
            ->update(['tipe_unit' => 'armada_jalan']);
    }

    public function down(): void
    {
        Schema::table('armadas', function (Blueprint $table) {
            $table->dropColumn('tipe_unit');
        });
    }
};

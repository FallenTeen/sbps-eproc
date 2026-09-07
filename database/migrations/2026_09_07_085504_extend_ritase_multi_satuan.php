<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * v6 (Bagian 21.4) — ritase multi-satuan (Tonase/Ritase/m³/Harian).
     * `total_upah_rit` diubah dari stored-generated column menjadi kolom biasa,
     * supaya bisa diisi/dinormalisasi dari `nominal` untuk satuan non-ritase.
     */
    public function up(): void
    {
        // 1. Tambah kolom baru untuk multi-satuan
        Schema::table('ritases', function ($table) {
            $table->enum('satuan_volume', ['tonase', 'ritase', 'm3', 'harian'])
                ->default('ritase')
                ->after('jumlah_rit');
            $table->decimal('jumlah_volume', 15, 2)->nullable()->after('satuan_volume');
            $table->decimal('nominal', 15, 2)->nullable()->after('tarif_per_rit_snapshot');
        });

        // 2. Ubah `total_upah_rit` dari stored-generated jadi kolom biasa.
        //    MySQL tidak bisa alter generated column langsung -> drop lalu add (bukan generated).
        DB::statement('ALTER TABLE ritases DROP COLUMN total_upah_rit');
        Schema::table('ritases', function ($table) {
            $table->decimal('total_upah_rit', 15, 2)->default(0)->after('nominal');
        });

        // 3. Backfill nilai existing: total_upah_rit = jumlah_rit * tarif_per_rit_snapshot
        DB::statement('UPDATE ritases SET total_upah_rit = COALESCE(jumlah_rit, 0) * COALESCE(tarif_per_rit_snapshot, 0)');
    }

    public function down(): void
    {
        // Kembalikan jadi stored-generated
        DB::statement('ALTER TABLE ritases DROP COLUMN total_upah_rit');
        Schema::table('ritases', function ($table) {
            $table->decimal('total_upah_rit', 15, 2)
                ->storedAs('jumlah_rit * tarif_per_rit_snapshot')
                ->after('nominal');
        });

        Schema::table('ritases', function ($table) {
            $table->dropColumn(['nominal']);
        });
        Schema::table('ritases', function ($table) {
            $table->dropColumn(['jumlah_volume']);
        });
        Schema::table('ritases', function ($table) {
            $table->dropColumn(['satuan_volume']);
        });
    }
};

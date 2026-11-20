<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nilai batas stok minimum per bahan baku/sparepart untuk penanda
 * "di bawah minimum" di mobile & dashboard (Bagian 21.7 §14d).
 * Default 10 menyelaraskan dengan ambang "mendekati habis" yang dipakai
 * InventoryDashboardAggregator (saldo <= 10) sebelum kolom ini tersedia.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bahan_bakus', function (Blueprint $table) {
            $table->float('stok_minimum')->default(10)->after('satuan');
        });
    }

    public function down(): void
    {
        Schema::table('bahan_bakus', function (Blueprint $table) {
            $table->dropColumn('stok_minimum');
        });
    }
};

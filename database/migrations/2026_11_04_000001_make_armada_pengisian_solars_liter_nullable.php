<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * TD-A (Meeting 5 & 6): driver tidak lagi wajib mengisi liter solar.
     *
     * Sesuai prinsip additive (22.5 prinsip #1/#3): semua kolom baru nullable
     * atau punya default, data lama tetap valid, tidak ada backfill data yang
     * incidential. `liter`/`harga_per_liter`/`foto_nota` menjadi nullable;
     * `liter_sumber` jejak sumber liter (null = belum diisi, `manual` = diisi
     * orang, `ocr` = hasil OCR nota fase berikutnya); `nota_lengkap` ikut
     * ada/tidaknya foto nota.
     */
    public function up(): void
    {
        Schema::table('armada_pengisian_solars', function (Blueprint $table) {
            $table->decimal('liter', 10, 2)->nullable()->change();
            $table->decimal('harga_per_liter', 15, 2)->nullable()->change();
            $table->string('foto_nota')->nullable()->change();

            $table->string('liter_sumber', 20)->nullable()->after('liter');
            $table->string('ocr_status', 20)->nullable()->after('liter_sumber');
            $table->boolean('nota_lengkap')->default(false)->after('ocr_status');
            $table->uuid('diperbarui_oleh_id')->nullable()->after('catatan');
            $table->timestamp('diverifikasi_pada')->nullable()->after('diperbarui_oleh_id');

            $table->foreign('diperbarui_oleh_id')->references('id')->on('users')->nullOnDelete();
        });

        // TD-A3: bbm_log 1:1 dengan pengisian - liter ikut nullable, biaya
        // tetap dari nominal. Anomali hanya dihitung bila liter terisi.
        Schema::table('bbm_logs', function (Blueprint $table) {
            $table->decimal('liter', 10, 2)->nullable()->change();
        });

        // Data lama: semua dibuat sebelum fitur ini, sehingga liter dianggap
        // input manual dan selalu ada foto nota (NOT NULL di migration asli).
        DB::table('armada_pengisian_solars')
            ->whereNull('liter_sumber')
            ->update(['liter_sumber' => 'manual', 'nota_lengkap' => true]);
    }

    public function down(): void
    {
        Schema::table('armada_pengisian_solars', function (Blueprint $table) {
            $table->dropForeign(['diperbarui_oleh_id']);
            $table->dropColumn(['liter_sumber', 'ocr_status', 'nota_lengkap', 'diperbarui_oleh_id', 'diverifikasi_pada']);
        });

        Schema::table('bbm_logs', function (Blueprint $table) {
            $table->decimal('liter', 10, 2)->nullable(false)->change();
        });

        Schema::table('armada_pengisian_solars', function (Blueprint $table) {
            $table->decimal('liter', 10, 2)->nullable(false)->change();
            $table->decimal('harga_per_liter', 15, 2)->nullable(false)->change();
            $table->string('foto_nota')->nullable(false)->change();
        });
    }
};

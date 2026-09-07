<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fase B (Bagian 21.3) — perluasan checklist harian untuk mobile:
     * solar (isian di checklist otomatis trigger RecordBBMAction), ODO pagi/sore
     * untuk armada_jalan (foto + manual), jam operasional + HM untuk alat_berat,
     * status siklus pagi->sore (berjalan/selesai), flag anomali odo_sore < odo_pagi,
     * dan client_uuid untuk idempotency submission mobile.
     */
    public function up(): void
    {
        Schema::table('armada_checklist_harians', function (Blueprint $table) {
            $table->enum('status', ['berjalan', 'selesai'])->default('berjalan')->after('kondisi_baik');
            $table->decimal('solar_liter', 10, 2)->nullable()->after('item_bermasalah');
            $table->decimal('solar_harga_rp', 15, 2)->nullable()->after('solar_liter');
            $table->decimal('odo_pagi', 12, 2)->nullable()->after('solar_harga_rp');
            $table->string('foto_odo_pagi')->nullable()->after('odo_pagi');
            $table->decimal('odo_sore', 12, 2)->nullable()->after('foto_odo_pagi');
            $table->string('foto_odo_sore')->nullable()->after('odo_sore');
            $table->time('jam_mulai_operasi')->nullable()->after('foto_odo_sore');
            $table->time('jam_selesai_operasi')->nullable()->after('jam_mulai_operasi');
            $table->decimal('hm_odo', 12, 2)->nullable()->after('jam_selesai_operasi');
            $table->boolean('odo_anomali')->default(false)->after('hm_odo');
            $table->string('client_uuid', 36)->nullable()->after('odo_anomali');

            $table->unique('client_uuid', 'armada_checklist_client_uuid_unique');
        });
    }

    public function down(): void
    {
        Schema::table('armada_checklist_harians', function (Blueprint $table) {
            $table->dropUnique('armada_checklist_client_uuid_unique');
            $table->dropColumn([
                'status',
                'solar_liter',
                'solar_harga_rp',
                'odo_pagi',
                'foto_odo_pagi',
                'odo_sore',
                'foto_odo_sore',
                'jam_mulai_operasi',
                'jam_selesai_operasi',
                'hm_odo',
                'odo_anomali',
                'client_uuid',
            ]);
        });
    }
};
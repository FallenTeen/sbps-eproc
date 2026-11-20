<?php

use App\Domain\Fleet\Enums\StokSolar;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Perluasan checklist harian untuk mobile.
     *
     * Tabel bersama `armada_checklist_harians` (dipakai armada & mesin produksi)
     * kini menjadi "Checklist Awal": hanya mencatat kondisi pagi.
     * - `items`        : kondisi per bagian (JSON) ala [{bagian, kondisi, catatan, foto}]
     * - `stok_solar`   : level indikator bahan bakar (enum), bukan liter
     * - foto ODO/stok  : wajib dari kamera mobile (path + metadata GPS/waktu)
     *
     * Kondisi sore kini terpisah di tabel `armada_checklist_akhirs` (1 baris per
     * checklist awal). Liter/rupiah solar pindah ke `armada_pengisian_solars`.
     */
    public function up(): void
    {
        Schema::table('armada_checklist_harians', function (Blueprint $table) {
            // Kolom pagi/awal (dipertahankan dari desain 2-stage sebelumnya).
            $table->decimal('odo_pagi', 12, 2)->nullable()->after('item_bermasalah');
            $table->string('foto_odo_pagi')->nullable()->after('odo_pagi');
            $table->json('foto_odo_pagi_metadata')->nullable()->after('foto_odo_pagi');
            $table->time('jam_mulai_operasi')->nullable()->after('foto_odo_pagi_metadata');
            $table->decimal('hm_odo', 12, 2)->nullable()->after('jam_mulai_operasi');
            $table->string('client_uuid', 36)->nullable()->after('hm_odo');

            // Field baru: kondisi per bagian + level stok solar.
            $table->json('items')->nullable()->after('item_bermasalah');
            $table->enum('stok_solar', StokSolar::values())->nullable()->after('items');
            $table->string('foto_stok_solar')->nullable()->after('stok_solar');
            $table->json('foto_stok_solar_metadata')->nullable()->after('foto_stok_solar');

            $table->unique('client_uuid', 'armada_checklist_client_uuid_unique');
            $table->unique(['checkable_type', 'checkable_id', 'tanggal'], 'armada_checklist_harian_unique');
        });

        // nullable=false untuk profil non-mesin; pakai desain sama dengan tabel awal.
        Schema::create('armada_checklist_akhirs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('checklist_awal_id');
            $table->date('tanggal');
            $table->json('items')->nullable();
            $table->boolean('kondisi_baik')->default(true);
            $table->text('item_bermasalah')->nullable();
            $table->enum('stok_solar', StokSolar::values())->nullable();
            $table->string('foto_stok_solar')->nullable();
            $table->json('foto_stok_solar_metadata')->nullable();
            $table->decimal('odo_akhir', 12, 2)->nullable();
            $table->string('foto_odo_akhir')->nullable();
            $table->json('foto_odo_akhir_metadata')->nullable();
            $table->time('jam_selesai_operasi')->nullable();
            $table->decimal('hm_akhir', 12, 2)->nullable();
            $table->boolean('odo_anomali')->default(false);
            $table->uuid('dicatat_oleh_karyawan_id')->nullable();
            $table->string('client_uuid', 36)->nullable();
            $table->timestamps();

            $table->unique('checklist_awal_id');
            $table->unique(['armada_id', 'tanggal']);
            $table->unique('client_uuid');

            $table->foreign('armada_id')->references('id')->on('armadas')->onDelete('cascade');
            $table->foreign('checklist_awal_id')->references('id')->on('armada_checklist_harians')->onDelete('cascade');
            $table->foreign('dicatat_oleh_karyawan_id')->references('id')->on('karyawans');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armada_checklist_akhirs');

        Schema::table('armada_checklist_harians', function (Blueprint $table) {
            $table->dropUnique('armada_checklist_client_uuid_unique');
            $table->dropUnique('armada_checklist_harian_unique');
            $table->dropColumn([
                'odo_pagi',
                'foto_odo_pagi',
                'foto_odo_pagi_metadata',
                'jam_mulai_operasi',
                'hm_odo',
                'client_uuid',
                'items',
                'stok_solar',
                'foto_stok_solar',
                'foto_stok_solar_metadata',
            ]);
        });
    }
};

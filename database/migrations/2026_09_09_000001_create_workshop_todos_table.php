<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 21.9 — Role Workshop: to-do list terjadwal.
 *
 * `workshop_todos` — servis rutin (grease, oli, dsb) yang dijadwalkan
 * (harian/mingguan/bulanan/tanggal tertentu), terpisah dari ajuan insidental
 * (21.8). Status `terjadwal`|`selesai` disimpan; `terlewat` diturunkan dari
 * jadwal (prinsip Bagian 0 #1: data turunan tidak disimpan).
 *
 * `pengajuan_servis_spareparts` mendapat kolom `workshop_todo_id` (nullable)
 * agar `RequestSparepartAction` punya dua sumber pemicu: pengajuan servis
 * insidental (21.8) atau to-do rutin (21.9).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workshop_todos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('jadwal_tipe'); // harian | mingguan | bulanan | tanggal_tertentu
            $table->string('jadwal_detail')->nullable(); // hari / tgl / Y-m-d sesuai tipe
            $table->uuid('armada_id')->nullable();
            $table->uuid('mesin_id')->nullable();
            $table->string('status')->default('terjadwal'); // terjadwal | selesai (terlewat diturunkan)
            $table->uuid('assigned_to')->nullable();
            $table->uuid('terkait_pengajuan_servis_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('armada_id')->references('id')->on('armadas')->nullOnDelete();
            $table->foreign('mesin_id')->references('id')->on('mesin_produksis')->nullOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->foreign('terkait_pengajuan_servis_id')
                ->references('id')->on('pengajuan_servis_armadas')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('pengajuan_servis_spareparts', function (Blueprint $table) {
            // Sejak 21.9 item sparepart bisa lahir dari to-do rutin tanpa
            // pengajuan insidental → induk wajib boleh NULL.
            $table->uuid('pengajuan_servis_armada_id')->nullable()->change();
            $table->uuid('workshop_todo_id')->nullable()->after('pengajuan_servis_armada_id');
            $table->foreign('workshop_todo_id')->references('id')->on('workshop_todos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_servis_spareparts', function (Blueprint $table) {
            $table->dropForeign(['workshop_todo_id']);
            $table->dropColumn('workshop_todo_id');
        });

        Schema::dropIfExists('workshop_todos');
    }
};

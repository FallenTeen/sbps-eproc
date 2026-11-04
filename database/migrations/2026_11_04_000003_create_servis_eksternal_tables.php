<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_servis_armadas', function (Blueprint $table) {
            $table->enum('tipe_servis', ['internal', 'eksternal'])
                ->default('internal')
                ->after('armada_id');
        });

        Schema::create('servis_eksternal_detail', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pengajuan_id')->constrained('pengajuan_servis_armadas')->cascadeOnDelete();
            $table->string('nama_bengkel');
            $table->text('alamat_bengkel')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('foto_bengkel')->nullable();
            $table->timestamp('foto_bengkel_diambil_pada')->nullable();
            $table->text('rincian_pekerjaan')->nullable();
            $table->decimal('total_biaya_estimasi', 15, 2)->default(0);
            $table->enum('verifikasi_workshop', ['belum', 'terverifikasi', 'bermasalah'])->default('belum');
            $table->foreignUuid('verifikasi_workshop_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verifikasi_workshop_pada')->nullable();
            $table->text('verifikasi_workshop_catatan')->nullable();
            $table->timestamps();
        });

        Schema::create('servis_eksternal_notas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pengajuan_id')->constrained('pengajuan_servis_armadas')->cascadeOnDelete();
            $table->string('foto_nota');
            $table->decimal('nominal_rp', 15, 2)->nullable();
            $table->date('tanggal_nota')->nullable();
            $table->foreignUuid('diinput_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servis_eksternal_notas');
        Schema::dropIfExists('servis_eksternal_detail');
        Schema::table('pengajuan_servis_armadas', function (Blueprint $table) {
            $table->dropColumn('tipe_servis');
        });
    }
};

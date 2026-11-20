<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pengisian bahan bakar oleh driver (step 02 mobile). Setiap baris
     * menyinkronkan 1 baris `bbm_logs` (tanpa approval). Liter/rupiah solar
     * pindah dari checklist ke sini.
     */
    public function up(): void
    {
        Schema::create('armada_pengisian_solars', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('checklist_awal_id')->nullable();
            $table->uuid('karyawan_id')->nullable();
            $table->uuid('dicatat_oleh')->nullable();
            $table->uuid('bbm_log_id')->nullable();
            $table->date('tanggal');
            $table->time('waktu')->nullable();
            $table->decimal('odo_atau_hm', 12, 2);
            $table->string('foto_odo');
            $table->json('foto_odo_metadata')->nullable();
            $table->decimal('liter', 10, 2);
            $table->decimal('nominal_rp', 15, 2);
            $table->decimal('harga_per_liter', 15, 2);
            $table->string('foto_nota');
            $table->json('foto_nota_metadata')->nullable();
            $table->text('catatan')->nullable();
            $table->string('client_uuid', 36)->unique();
            $table->timestamps();

            $table->index(['armada_id', 'tanggal']);

            $table->foreign('armada_id')->references('id')->on('armadas')->onDelete('cascade');
            $table->foreign('checklist_awal_id')->references('id')->on('armada_checklist_harians')->nullOnDelete();
            $table->foreign('karyawan_id')->references('id')->on('karyawans');
            $table->foreign('dicatat_oleh')->references('id')->on('users');
            $table->foreign('bbm_log_id')->references('id')->on('bbm_logs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armada_pengisian_solars');
    }
};

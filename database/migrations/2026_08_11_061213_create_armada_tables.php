<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('armadas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id'); // hanya GCS (tapi truck molen CBP juga dicatat di sini)
            $table->string('plat_nomor')->unique();
            $table->string('kode_unit')->unique();
            $table->enum('jenis', ['dump_truck', 'alat_berat', 'truck_molen', 'lainnya']);
            $table->enum('model_tarif', ['ritase', 'sewa_jam', 'internal'])->default('ritase');
            $table->integer('tahun')->nullable();
            $table->string('kapasitas')->nullable(); // ton/m³
            $table->enum('status', ['aktif', 'servis', 'nonaktif'])->default('aktif');
            $table->uuid('titik_id')->nullable(); // lokasi basecamp saat ini
            $table->date('tanggal_mulai_pakai')->nullable();
            $table->date('tanggal_servis_terakhir')->nullable();
            $table->timestamps();

            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis');
            $table->foreign('titik_id')->references('id')->on('titiks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('armadas');
    }
};

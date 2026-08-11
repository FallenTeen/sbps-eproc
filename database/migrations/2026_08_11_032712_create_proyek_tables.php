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
        Schema::create('proyek', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id');
            $table->string('kode_proyek')->unique();
            $table->string('nama');
            $table->enum('tipe_proyek', ['internal', 'kontrak_klien']);
            $table->string('client')->nullable();
            $table->string('lokasi')->nullable();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai_rencana')->nullable();
            $table->date('tanggal_selesai_aktual')->nullable();
            $table->enum('status', ['draft', 'aktif', 'selesai', 'dihentikan'])->default('draft');
            $table->text('catatan')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyek');
    }
};

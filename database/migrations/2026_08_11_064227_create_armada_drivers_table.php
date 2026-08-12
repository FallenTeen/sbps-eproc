<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('armada_drivers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('armada_id');
            $table->uuid('karyawan_id');
            $table->enum('tipe', ['standby', 'kondisional'])->default('standby');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->timestamps();

            $table->foreign('armada_id')->references('id')->on('armadas')->onDelete('cascade');
            $table->foreign('karyawan_id')->references('id')->on('karyawans');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('armada_drivers');
    }
};

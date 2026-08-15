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
        Schema::create('formulir_lapangans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('presensi_id');
            $table->text('kondisi_area')->nullable();
            $table->text('aktivitas_dilakukan');
            $table->text('kendala')->nullable();
            $table->string('foto')->nullable();
            $table->text('catatan_tambahan')->nullable();
            $table->timestamps();

            $table->foreign('presensi_id')->references('id')->on('presensis')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formulir_lapangans');
    }
};

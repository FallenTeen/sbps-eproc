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
        Schema::create('presensis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('karyawan_id');
            $table->uuid('titik_id')->nullable();
            $table->datetime('check_in');
            $table->decimal('check_in_lat', 10, 8)->nullable();
            $table->decimal('check_in_lng', 11, 8)->nullable();
            $table->datetime('check_out')->nullable();
            $table->decimal('check_out_lat', 10, 8)->nullable();
            $table->decimal('check_out_lng', 11, 8)->nullable();
            $table->enum('status_validasi', ['valid', 'tidak_valid', 'luar_radius'])->default('valid');
            $table->text('catatan_override')->nullable();
            $table->timestamps();
            
            $table->foreign('karyawan_id')->references('id')->on('karyawans')->onDelete('cascade');
            $table->foreign('titik_id')->references('id')->on('titiks')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presensis');
    }
};

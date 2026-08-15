<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mobile_tracking_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('karyawan_id');
            $table->uuid('presensi_id')->nullable();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('karyawan_id')->references('id')->on('karyawans')->onDelete('cascade');
            $table->foreign('presensi_id')->references('id')->on('presensis')->onDelete('set null');
            $table->index(['karyawan_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_tracking_locations');
    }
};

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
        Schema::create('service_intervals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('serviceable'); // armada atau mesin_produksi
            $table->integer('interval_bulan')->default(2);
            $table->integer('interval_jam_operasional')->nullable(); // opsional
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servive_intervals');
    }
};

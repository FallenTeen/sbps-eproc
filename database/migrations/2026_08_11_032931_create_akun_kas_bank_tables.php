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
        Schema::create('akun_kas_banks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_bisnis_id');
            $table->string('nama');
            $table->enum('jenis_kas', ['kas_kecil', 'kas_besar', 'kas_operasional', 'bank']);
            $table->uuid('akun_coa_id')->nullable();
            $table->decimal('saldo_awal', 15, 2)->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();

            $table->foreign('unit_bisnis_id')->references('id')->on('unit_bisnis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('akun_kas_banks');
    }
};

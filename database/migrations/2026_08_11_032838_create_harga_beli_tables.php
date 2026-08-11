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
        Schema::create('harga_beli', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bahan_baku_id');
            $table->uuid('supplier_id');
            $table->decimal('harga', 15, 2);
            $table->date('berlaku_dari');
            $table->date('berlaku_sampai')->nullable();
            $table->timestamps();

            $table->foreign('bahan_baku_id')->references('id')->on('bahan_baku');
            $table->foreign('supplier_id')->references('id')->on('supplier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('harga_beli');
    }
};

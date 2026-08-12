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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode_po')->unique();
            $table->uuid('proyek_id')->nullable();
            $table->uuid('titik_id')->nullable();
            $table->uuid('supplier_id');
            $table->uuid('created_by');
            $table->date('tanggal_pesan');
            $table->date('tanggal_diperlukan')->nullable();
            $table->decimal('total', 15, 2)->default(0);
            $table->string('status')->default('draft'); // state machine
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('proyek_id')->references('id')->on('proyeks');
            $table->foreign('titik_id')->references('id')->on('titiks');
            $table->foreign('supplier_id')->references('id')->on('suppliers');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};

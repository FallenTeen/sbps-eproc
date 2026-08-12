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
        Schema::create('pembayarans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_order_id');
            $table->decimal('jumlah', 15, 2);
            $table->date('tanggal');
            $table->enum('metode', ['tunai', 'transfer', 'cek', 'lainnya']);
            $table->uuid('akun_kas_bank_id')->nullable();
            $table->uuid('dicatat_oleh');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('akun_kas_bank_id')->references('id')->on('akun_kas_banks');
            $table->foreign('dicatat_oleh')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembayarans');
    }
};

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
        Schema::create('mutasi_kas_banks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('akun_kas_bank_id');
            $table->string('kategori'); // referensi ke master kategori transaksi
            $table->enum('tipe', ['masuk', 'keluar']);
            $table->decimal('jumlah', 15, 2);
            $table->nullableMorphs('referensi'); // polymorphic: pembayaran, pembayaran_klien, gaji_periode, dll
            $table->date('tanggal');
            $table->text('catatan')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('akun_kas_bank_id')->references('id')->on('akun_kas_banks');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mutasi_kas_banks');
    }
};
